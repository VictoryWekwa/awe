import actions from './actions'

class Awe {
  constructor({store, host, port}) {
    this.store = store;
    this.finishedInitialFetch = false;
    this.clientId = null;
    this.pendingActions = [];
    this.ws = new WebSocket(`ws://${host}:${port}`);
    this.ws.onmessage = this.onMessage.bind(this);
    this.ws.onerror = (error) => console.error('ws error', error);
    Awe.fetchInitialState().then((initialState) => {
      Awe.processInitialState(this.store, initialState);
      const {version} = initialState;
      for (const pendingAction of this.pendingActions) {
        if (pendingAction.version > version) {
          this.store.dispatch(pendingAction);
        }
      }
      this.pendingActions = [];
      this.finishedInitialFetch = true;
    });
  }

  static start({store, host = '127.0.0.1', port = 9000, initialState}) {
    let instance;
    if (initialState) {
      const notSupported = () => console.warn('This is not supported in offline mode');
      instance = {
        call: notSupported,
        updateVariable: notSupported,
        fetchExport: notSupported
      };
      setTimeout(() => {
        Awe.processInitialState(store, initialState);
      }, 0);
    } else {
      instance = new Awe({store, host, port});
    }

    const customElements = {};
    window.Awe = {
      instance,
      register: (name, fn) => {customElements[name] = fn},
      customElements,
      store,
      call: instance.call.bind(instance),
      updateVariable: instance.updateVariable.bind(instance)
    };
  }

  static async fetchInitialState() {
    return await (await fetch('/initial-state')).json();
  }

  async fetchExport() {
    return await fetch('/export');
  }

  call(functionId, kwargs) {
    this.sendMessage({type: 'call', functionId, kwargs, clientId: this.clientId})
  }

  updateVariable(variableId, value) {
    this.store.dispatch(actions.updateVariable(variableId, value));
    this.sendMessage({type: 'updateVariable', variableId, value, clientId: this.clientId})
  }

  sendMessage(message) {
    this.ws.send(JSON.stringify(message));
  }

  onMessage(message) {
    const action = JSON.parse(message.data);
    if (action.type === 'setClientId') {
      this.clientId = action.clientId;
    } else if (action.type === 'refresh') {
      document.location.reload();
    } else if (!this.finishedInitialFetch) {
      this.pendingActions.push(action);
    } else {
      this.store.dispatch(action);
    }
  };

  static processInitialState(store, initialState) {
    document.title = initialState.title;
    store.dispatch({type: 'processInitialState', ...initialState});
  }
}

export default Awe;
