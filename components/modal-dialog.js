import { html } from "uhtml";
import { Base, componentMap } from "./base";
import css from "ustyler";
import Globals from "../globals";

export class ModalDialog extends Base {
  static defaultProps = {
    stateName: "$modalOpen",
  };
  static allowedChildren = ["stack"];

  template() {
    const state = Globals.state;
    const open = !!state.get(this.props.stateName);
    if (open) {
      return html`<div
        class="modal"
        id=${this.id}
        ?open=${!!state.get(this.props.stateName)}
      >
        <div>${this.children.map((child) => child.template())}</div>
      </div>`;
    } else {
      return html``;
    }
  }
}

componentMap.addMap("modal dialog", ModalDialog);

css`
  div.modal {
    visibility: hidden;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: block;
    width: 100%;
    height: 100%;
    z-index: 100;
    background-color: rgb(0, 0, 0, 0.1);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  body.designing #UI div.modal[open],
  body.designing #UI div.modal.highlight {
    visibility: visible;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: block;
    width: 100%;
    height: 100%;
    z-index: 100;
    background-color: rgb(0, 0, 0, 0.1);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  div.modal[open] {
    visibility: visible;
  }

  div.modal > div {
    width: 80%;
    height: 80%;
    opacity: 1;
    background-color: white;
    border: 2px solid black;
  }
`;
