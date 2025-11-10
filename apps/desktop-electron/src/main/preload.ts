import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('myclinicdb', {
  version: '0.1.0'
});
