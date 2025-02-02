/**
 * A specialised GoldenLayout component that binds GoldenLayout container
 * lifecycle events to react components
 *
 * @constructor
 *
 * @param {lm.container.ItemContainer} container
 * @param {Object} state state is not required for react components
 */
lm.utils.ReactComponentHandler = function (container, state) {
  this._reactComponent = null;
  this._root = null;
  this._originalComponentWillUpdate = null;
  this._container = container;
  this._initialState = state;
  this._reactClass = this._getReactClass();
  this._container.on("open", this._render, this);
  this._container.on("destroy", this._destroy, this);
};

lm.utils.copy(lm.utils.ReactComponentHandler.prototype, {
  /**
   * Creates the react class and component and hydrates it with
   * the initial state - if one is present
   *
   * By default, react's getInitialState will be used
   *
   * @private
   * @returns {void}
   */
  _render: function () {
    const container = this._container.getElement()[0];

    if (!this._root) {
      this._root = ReactDOM.createRoot(container);
    }

    this._reactComponent = this._getReactComponent();

    this._root.render(this._reactComponent);
  },
  /**
   * Removes the component from the DOM and thus invokes React's unmount lifecycle
   *
   * @private
   * @returns {void}
   */
  _destroy: function () {
    this._root.unmount();
    this._container.off("open", this._render, this);
    this._container.off("destroy", this._destroy, this);
  },

  /**
   * Hooks into React's state management and applies the componentstate
   * to GoldenLayout
   *
   * @private
   * @returns {void}
   */
  _onUpdate: function (nextProps, nextState) {
    this._container.setState(nextState);
    this._originalComponentWillUpdate.call(
      this._reactComponent,
      nextProps,
      nextState
    );
  },

  /**
   * Retrieves the react class from GoldenLayout's registry
   *
   * @private
   * @returns {React.Class}
   */
  _getReactClass: function () {
    var componentName = this._container._config.component;
    var reactClass;

    if (!componentName) {
      throw new Error(
        "No react component name. type: react-component needs a field `component`"
      );
    }

    reactClass = this._container.layoutManager.getComponent(componentName);

    if (!reactClass) {
      throw new Error(
        'React component "' +
          componentName +
          '" not found. ' +
          "Please register all components with GoldenLayout using `registerComponent(name, component)`"
      );
    }

    return reactClass;
  },

  /**
   * Copies and extends the properties array and returns the React element
   *
   * @private
   * @returns {React.Element}
   */
  _getReactComponent: function () {
    var defaultProps = {
      glEventHub: this._container.layoutManager.eventHub,
      glContainer: this._container,
    };
    var props = $.extend(defaultProps, this._container._config.props);
    return React.createElement(this._reactClass, props);
  },
});
