import { toast } from "react-toastify";
import { useAppDispatch } from '../../store';
import { login } from '../../store/authReducer';
import { useNavigate } from "react-router-dom";
import { useConnect } from "../../hooks/useConnect";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { injected, walletConnect } from '../../hooks/connector';

// import axios from "../../api/axios";

import "react-toastify/dist/ReactToastify.css";
import styles from "./Auth.module.css";

const AUTH_URL: string = "/auth/login-with-address";

const Connect = () => {
    const navigate = useNavigate();
    const axios = useAxiosPrivate();
    const dispatch = useAppDispatch();
    const { connect, account, web3PersonalSign, library, disconnect } = useConnect();

    const notify = (isError: boolean, msg: string): void => {
        if (isError) {
            toast.error(msg, {
                position: toast.POSITION.TOP_RIGHT,
            });
        } else {
            toast.success(msg, {
                position: toast.POSITION.TOP_RIGHT,
            });
        }
    };

    const auth = async () => {
        if (account) {
            await axios.post(AUTH_URL, { address: account.toLowerCase() })
            .then((res: any) => {
                let data = res.data;
                
                dispatch(login({ player: data.player }));
                notify(false, data.message);
            })
            .catch((err: any) => {
                notify(true, `${err.response.data.message}`);
            });
        }
    };

    const submitHandler = async (type: string, provider: any) => {
        try {
            await connect(type, provider)
            .then(() => {
                if (account) {
                    web3PersonalSign(
                        library,
                        account,
                        "I confirm that this is my address, and I want login!",
                        () => {
                            auth();
                        },
                        () => {
                            disconnect();
                            notify(true, "Something went wrong!");
                        }
                    );
                }
            });
            //navigate(from, { replace: true });
        } catch (err: any) {
            notify(true, `${err.response.data.message}`);
        }
    };
    
    return (
        <div className={styles.signUpContainer}>
            <div className={styles.submitBtn} onClick={() => submitHandler("metaMask", injected)}>
                <img
                    className={styles.img}
                    src={`/images/meta.png`}
                    alt="metamask"
                />
            </div>
            <div className={styles.submitBtn} onClick={() => submitHandler("walletConnect", walletConnect)}>
                <img
                    className={styles.img}
                    src={`/images/walletconnect.png`}
                    alt="wallet connect"
                />
            </div>
        </div>
    );
};

export default Connect;