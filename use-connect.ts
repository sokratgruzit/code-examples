import { useState, useMemo } from "react";
import { useWeb3React } from "@web3-react/core";
import { useAppDispatch, useAppSelector } from "../store";
import { setUpdateState, setTriedReconnect, setConnectionError, logout } from "../store/authReducer";

export const useConnect = () => {
    const [connectionLoading, setConnectionLoading] = useState<boolean>(false);
    
    const isConnected = useAppSelector((state) => state.auth.isConnected);
    const providerType = useAppSelector((state) => state.auth.providerType);
    
    let { activate, account, library, deactivate, chainId, active } = useWeb3React();
    const dispatch = useAppDispatch();

    async function metaMaskEagerlyConnect(injected: any, callback?: () => void) {
        if (providerType === "metaMask") {
            try {
                injected
                .isAuthorized()
                .then((isAuthorized: boolean) => {
                    if (isAuthorized && isConnected) {
                        let updatedState = {
                            account,
                            isConnected: true,
                            providerType
                        };

                        connect(providerType, injected);
                        dispatch(setUpdateState({ updatedState }));
                    } else {
                        let updatedState = {
                            account: "",
                            isConnected: false
                        };

                        dispatch(setUpdateState({ updatedState }));
                        dispatch(setTriedReconnect({ triedReconnect: true }));
                    }
                })
                .finally(() => {
                    if (callback) {
                        callback();
                    }
                });
            } catch (err) {
                console.log(err);
            }
        }
    }

    async function walletConnectEagerly(walletConnect: any, callback?: () => void) {
        if (providerType === "walletConnect") {
            try {
                if (isConnected) {
                    setTimeout(() => {
                        let updatedState = {
                            account,
                            isConnected: true,
                            providerType
                        };

                        connect(providerType, walletConnect);
                        dispatch(setUpdateState({ updatedState }));
                    }, 0);
                } else {
                    let updatedState = {
                        account: "",
                        isConnected: false
                    };

                    dispatch(setUpdateState({ updatedState }));
                    dispatch(setTriedReconnect({ triedReconnect: true }));
                }
            } catch (err) {
                console.log(err);
            }
        }
    }

    const connect = async (providerType: string, injected: any) => {
        let win: any = window;
        
        if (typeof win.ethereum === "undefined" && providerType === "metaMask") {
            dispatch(setConnectionError({ connectionError: "No MetaMask detected" }));
            return;
        }

        if (providerType === "metaMask") {
            setConnectionLoading(true);
        }

        if (active) {
            await disconnect();
        }
        
        try {
            new Promise((resolve, reject) => {
                activate(injected, undefined, true).then(resolve).catch(reject);
            })
            .then(() => {
                let updatedState = {
                    isConnected: true,
                    providerType
                };
                
                dispatch(setUpdateState({ updatedState }));
            })
            .catch((e) => {
                let updatedState = {
                    account: "", 
                    isConnected: false
                };

                dispatch(setUpdateState({ updatedState }));

                if (
                    e.toString().startsWith("UnsupportedChainIdError") ||
                    e.toString().startsWith("t: Unsupported chain id")
                ) {
                    dispatch(setConnectionError({ connectionError: "Please switch your network in wallet" }));
                }
            })
            .finally(() => {
                setTimeout(() => {
                    dispatch(setTriedReconnect({ triedReconnect: true }));
                }, 500);

                setConnectionLoading(false);
            });
        } catch (error) {
            console.log("Error on connecting: ", error);
        }
    };

    async function disconnect() {
        try {
            if (library && library.provider && library.provider.close) {
                await library.provider.close();
            }
            
            deactivate();
            dispatch(logout());
        } catch (error) {
            console.log("Error on disconnect: ", error);
        }
    }

    async function web3PersonalSign(
        library: any, 
        account: string | undefined, 
        message: string, 
        callback: (a: string | undefined, s: any) => void, 
        errCallback: (e: any) => void
    ) {
        console.log(account, message)
        try {
            const signature = await library.eth.personal.sign(message, account);
            if (callback) callback(account, signature);
        } catch (err) {
            if (errCallback) errCallback(err);
        }
    }

    const values = useMemo(
        () => ({
            account: account ?? "",
            active,
            connect,
            disconnect,
            library,
            connectionLoading,
            chainId,
            metaMaskEagerlyConnect,
            walletConnectEagerly,
            web3PersonalSign
        }),
        [account, active, connectionLoading, chainId, library],
    );

    return values;
};
