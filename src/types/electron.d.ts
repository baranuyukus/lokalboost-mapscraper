export interface IElectronAPI {
    ipcRenderer: {
        invoke: (channel: string, ...args: any[]) => Promise<any>;
        on: (channel: string, listener: (...args: any[]) => void) => void;
        removeAllListeners: (channel: string) => void;
    };
}

declare global {
    interface Window {
        ipcRenderer: IElectronAPI['ipcRenderer'];
    }
}

export { };
