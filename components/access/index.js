import { html } from "uhtml";
import css from "ustyler";
import { Base } from "../base";
import { TabControl, TabPanel } from "../tabcontrol";
import { AccessMethod } from "./method";
import { AccessPattern, Group } from "./pattern";
import { AccessCues } from "./cues";
import { extender } from "proxy-pants";

const AccessProto = {
  access: {},
  node: null,
  cue(value = "button") {
    this.setAttribute("cue", value);
  },
  /** @type {Group[]} */
  groups: [],
};

/** Maintain data for each visible button in a WeakMap */
export const ButtonWrap = extender(AccessProto);

const EventWrapProto = {
  access: {},
};

export const EventWrap = extender(EventWrapProto);

/**
 * Provide a ref to update the map
 *
 * @param {Object} data
 * @returns {function(Node)}
 */
export function UpdateAccessData(data) {
  return (node) => {
    const button = ButtonWrap(node);
    button.access = data;
    button.node = node;
  };
}

export class Access extends Base {
  /**
   * @param {SomeProps} props
   * @param {Base|Null} parent
   */
  constructor(props, parent) {
    super(props, parent);

    /** @type {TabControl} */
    const tabs = new TabControl(
      { scale: "10", tabEdge: "top", stateName: "accessTab" },
      this
    );

    const methodPanel = new TabPanel(
      {
        name: "Method",
        background: "cyanish white",
      },
      tabs
    );
    methodPanel.children = [new AccessMethod({}, methodPanel)];

    const patternPanel = new TabPanel(
      {
        name: "Pattern",
        background: "bluish white",
      },
      tabs
    );
    patternPanel.children = [new AccessPattern({}, patternPanel)];

    const cuePanel = new TabPanel(
      {
        name: "Cues",
        background: "magentaish white",
      },
      tabs
    );
    cuePanel.children = [new AccessCues({}, cuePanel)];

    tabs.children = [methodPanel, patternPanel, cuePanel];

    this.children = [tabs];
  }

  template() {
    return html`${this.children.map((child) => child.template())} `;
  }
}

css`
  .tabcontrol .tabcontrol.top {
    flex-direction: column;
  }
  .tabcontrol .tabcontrol.top .panels {
    order: 2;
  }
  .tabcontrol .tabcontrol.top .buttons {
    order: 1;
  }
  .tabcontrol .tabcontrol.top .buttons button[active] {
    border-bottom: 1px;
    margin-top: 0px;
  }
  .tabcontrol .tabcontrol.top .buttons button {
    border-top-left-radius: 0em;
    border-top-right-radius: 0em;
    margin-top: 10px;
    margin-right: 10px;
  }

  .tabcontrol .tabcontrol .buttons {
    display: block;
    border-bottom: 2px solid black;
  }
`;
