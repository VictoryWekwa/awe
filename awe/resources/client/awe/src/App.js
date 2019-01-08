import React, {Component} from 'react';
import {connect} from 'react-redux';
import {HotKeys} from 'react-hotkeys';
import components from './components';
import Error from './components/internal/Error'
import Options, {doExport} from './components/internal/Options'
import DisplayOptionsButton from './components/internal/DisplayOptionsButton';
import ExportObjectResult from './components/internal/ExportObjectResult';
import actions from './actions';
import './App.css';

const fallbackElementCreate = (element) => <div key={element.props.key}/>;

function processElement(element) {
  for (const [prop, root] of Object.entries(element.propChildren)) {
    element.props[prop] = processElement(root);
  }
  element.children = element.children.map(processElement);
  const elementType = element.elementType;
  const create = components[elementType] || window.Awe.customElements[elementType] || fallbackElementCreate;
  return create(element);
}

function createRootElement(roots, elements, variables, style) {
    const sortedElements = Object.values(elements).sort((a, b) => a.index - b.index);
    const rootElement = {elementType: 'div', children: [], props: {style}, propChildren: {}};
    for (const element of sortedElements) {
      for (const [prop, rootId] of Object.entries(element.propChildren)) {
        element.propChildren[prop] = createRootElement(roots, roots[rootId] || {}, variables);
      }
      element.variables = variables;
      const parentElement = elements[element.parentId] || rootElement;
      parentElement.children.push(element);
    }
    return rootElement;
}

class App extends Component {
  render() {
    const roots = this.props.roots.toJS();
    const variables = this.props.variables.toJS();
    const style = this.props.style.toJS();
    const {displayOptions, doExport} = this.props;
    const rootElement = createRootElement(roots, roots.root, variables, style);
    const processedRoot = processElement(rootElement);
    return (
      <HotKeys
        focused
        keyMap={{displayOptions: 'A A A', doExport: 'A A E'}}
        handlers={{displayOptions, doExport}}>
        <div>
          {processedRoot}
          <Error/>
          <Options/>
          <ExportObjectResult/>
          <DisplayOptionsButton/>
        </div>
      </HotKeys>
    )
  }
}

export default connect(
  state => ({
    roots: state.get('roots'),
    variables: state.get('variables'),
    style: state.get('style'),
    reload: state.get('reload')
  }),
  dispatch => ({
    displayOptions: () => dispatch(actions.displayOptions),
    doExport: doExport(dispatch, true),
  })
)(App);
