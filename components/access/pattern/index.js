import db from "../../../db";
import { html } from "uhtml";
import css from "ustyler";
import Globals from "../../../globals";
import * as icons from "../../icons";
import { Select, String, Integer, Expression, Field } from "../../props";
import { TreeBase } from "../../treebase";
import { Base } from "../../base";
import { ButtonWrap } from "../index";

/** @typedef {ReturnType<ButtonWrap<Node>>} Button */

/** @typedef {Button | Group} Target */

/**
 * Group is a collection of Buttons or Groups and associated properties such as
 * the label and cue.
 */
export class Group {
  /**
   * @param {Target[]} members
   * @param {Object} props
   */
  constructor(members, props) {
    /** @type {Target[]} */
    this.members = members;
    this.groupProps = props;
  }

  get length() {
    return this.members.length * this.groupProps.Cycles.value;
  }

  /** @param {Number} index */
  member(index) {
    if (index < 0 || index >= this.length) {
      return undefined;
    } else {
      return this.members[index % this.members.length];
    }
  }

  cue(value = "group") {
    // console.log("cue group", this.members);
    for (const member of this.members) {
      member.cue(value);
    }
  }

  /**
   * Find the index of the member in a breadth-first search
   *
   * @param {Target} target
   */
  indexOf(target) {
    // first see if it is at this level
    const i = this.members.indexOf(target);
    if (i >= 0) return i;

    // find the sub-group that contains it
    for (let i = 0; i < this.members.length; i++) {
      const member = this.members[i];
      if (member instanceof Group && member.indexOf(target) >= 0) {
        return i;
      }
    }

    // not found
    return -1;
  }
}

class PatternBase extends TreeBase {
  /** @type {PatternBase[]} */
  children = [];

  /**
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    return input;
  }
}

export class PatternManager extends PatternBase {
  /** @type {Group} */
  targets;
  /**
   * Stack keeps track of the nesting as we walk the tree
   *
   * @type {{ group: Group; index: number }[]}
   */
  stack = [];

  /**
   * @type {Boolean} - cue is active when true
   */
  cued = false;

  // props
  Cycles = new Integer(2, { min: 1 });
  Cue = new Select(Object.keys(Globals.cues));

  /**
* Load the PatternManager from the db
  @returns {Promise<PatternManager>}
*/
  static async load() {
    const fallback = {
      className: "PatternManager",
      props: {
        Cycles: 2,
        Cue: "default",
      },
      children: [],
    };
    const pattern = await db.read("pattern", fallback);
    return /** @type {PatternManager} */ (PatternManager.fromObject(pattern));
  }

  template() {
    const { Cycles, Cue } = this;
    return html`
      <div class=${this.className}>
        ${Cycles.input()} ${Cue.input()} ${this.orderedChildren()}
        ${this.addChildButton("+Selector", PatternSelector)}
        ${this.addChildButton("+Group", PatternGroup)}
      </div>
    `;
  }

  onUpdate() {
    db.write("pattern", this.toObject());
    Globals.state.update();
  }

  /**
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    let members = [];
    for (const child of this.children) {
      const r = child.apply(input);
      if (r.length > 0) {
        if (r instanceof Group) {
          members.push(r);
        } else {
          members = members.concat(r);
        }
      }
    }
    if (members.length > 0) return [new Group(members, this.props)];
    else return [];
  }

  /** Collect the nodes from the DOM and process them into targets */
  refresh() {
    // gather the buttons from the UI
    const buttons = [];
    for (const node of document.querySelectorAll("#UI button:not(:disabled)")) {
      buttons.push(ButtonWrap(node));
    }

    let members = [];
    if (this.children.length) {
      for (const child of this.children) {
        const r = child.apply(buttons);
        if (r.length > 0) {
          if (r instanceof Group) {
            members.push(r);
          } else {
            members = members.concat(r);
          }
        }
      }
    } else {
      members = buttons;
    }
    this.targets = new Group(members, this.props);
    this.start();
  }

  start() {
    this.stack = [{ group: this.targets, index: -1 }];
    this.cue();
  }

  /**
   * Current keeps track of the currently active node or group
   *
   * @type {Target}
   */
  get current() {
    const { group, index } = this.stack[0];
    return group.member(index);
  }

  /** @param {EventTarget} target */
  setCurrent(target) {
    const top = this.stack[0];
    if (target instanceof Node) {
      const button = ButtonWrap(target);
      top.index = top.group.indexOf(button);
    }
  }

  next() {
    const top = this.stack[0];
    if (top.index < top.group.length - 1) {
      top.index++;
    } else if (this.stack.length > 1) {
      this.stack.shift();
    } else if (this.stack.length == 1) {
      top.index = 0;
    } else {
      // stack is empty ignore
      console.log("empty stack?");
    }
    this.cue();
  }

  activate() {
    let current = this.current;
    if (!current) return;
    if (current instanceof Group) {
      console.log("activate group", current, this.stack);
      while (current.length == 1 && current.members[0] instanceof Group) {
        current = current.members[0];
      }
      this.stack.unshift({ group: current, index: 0 });
      console.log("activated", this.current, this.stack);
    } else {
      const name = current.access.ComponentName;
      console.log("activate button", current);
      if ("onClick" in current.access) {
        console.log("calling onClick");
        current.access.onClick();
      } else {
        console.log("applyRules", name, current.access);
        Globals.rules.applyRules(name, "press", current.access);
      }
    }
    this.cue();
  }

  clearCue() {
    this.cued = false;
    for (const element of document.querySelectorAll("[cue]")) {
      element.removeAttribute("cue");
    }
  }

  cue() {
    this.clearCue();
    const current = this.current;
    if (!current) return;
    this.cued = true;
    this.current.cue();
  }
}
PatternBase.register(PatternManager);

class PatternGroup extends PatternBase {
  // props
  Name = new String("");
  Cycles = new Integer(2, { min: 1 });
  Cue = new Select(Object.keys(Globals.cues));

  template() {
    const { Name, Cycles, Cue } = this;
    return html`<fieldset class=${this.className}>
      <legend>Group: ${Name.value}</legend>
      ${Name.input()} ${Cycles.input()} ${Cue.input()} ${this.orderedChildren()}
      ${this.addChildButton("+Selector", PatternSelector)}
      ${this.addChildButton("+Group", PatternGroup)}
      ${this.movementButtons("Group")}
    </fieldset>`;
  }

  /**
   * Build a group from the output of the selectors applied to the input
   *
   * @param {Target[]} input
   */
  apply(input) {
    let members = [];
    for (const child of this.children) {
      const r = child.apply(input);
      if (r.length > 0) {
        if (r instanceof Group) {
          members.push(r);
        } else {
          members = members.concat(r);
        }
      }
    }
    if (members.length > 0) return [new Group(members, this.props)];
    else return [];
  }
}
PatternBase.register(PatternGroup);

class PatternSelector extends PatternBase {
  template() {
    return html`<fieldset class=${this.className}>
      <legend>Selector</legend>
      ${this.unorderedChildren()} ${this.addChildButton("+Filter", Filter)}
      ${this.addChildButton("+Order by", OrderBy)}
      ${this.addChildButton("+Group by", GroupBy)}
      ${this.movementButtons("selector")}
    </fieldset>`;
  }

  /**
   * Select buttons from the input
   *
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    return this.children.reduce(
      (previous, operator) => operator.apply(previous),
      input
    );
  }
}
PatternBase.register(PatternSelector);

class Filter extends PatternBase {
  Filter = new Expression();
  template() {
    const { Filter } = this;
    return html`<div class=${this.className}>
      ${Filter.input()}${this.deleteButton({ title: "Delete this filter" })}
    </div>`;
  }
  /**
   * Select buttons from the input
   *
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    if (input[0] instanceof Group) {
      return input
        .map(
          (/** @type {Group} */ group) =>
            new Group(this.apply(group.members), group.groupProps)
        )
        .filter((target) => target.length > 0);
    } else {
      return input.filter((/** @type {Button} */ button) =>
        this.Filter.eval(button.access)
      );
    }
  }
}
PatternBase.register(Filter);

// allow the sort to handle numbers reasonably
const comparator = new Intl.Collator(undefined, {
  numeric: true,
});

class OrderBy extends PatternBase {
  OrderBy = new Field();
  template() {
    const { OrderBy } = this;
    return html`<div class=${this.className}>
      ${OrderBy.input()}${this.deleteButton({ title: "Delete this order by" })}
    </div>`;
  }
  /**
   * Select buttons from the input
   *
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    if (input[0] instanceof Group) {
      return input
        .map(
          (/** @type {Group} */ group) =>
            new Group(this.apply(group.members), group.groupProps)
        )
        .filter((target) => target.length > 0);
    } else {
      const key = this.OrderBy.value.slice(1);
      return [.../** @type {Button[]} */ (input)].sort((a, b) =>
        comparator.compare(a.access[key], b.access[key])
      );
    }
  }
}
PatternBase.register(OrderBy);

class GroupBy extends PatternBase {
  GroupBy = new Field();
  Name = new String("");
  Cue = new Select(Object.keys(Globals.cues));
  Cycles = new Integer(2);
  template() {
    const { GroupBy, Name, Cue, Cycles } = this;
    return html`<div class=${this.className}>
      ${GroupBy.input()} ${Name.input()}
      ${this.deleteButton({ title: "Delete this Group By" })}
      <details>
        <summary title="Details">${icons.Details}</summary>
        ${Cue.input()} ${Cycles.input()}
      </details>
    </div>`;
  }
  /**
   * Select buttons from the input
   *
   * @param {Target[]} input
   * @returns {Target[]}
   */
  apply(input) {
    if (input[0] instanceof Group) {
      return input
        .map(
          (/** @type {Group} */ group) =>
            new Group(this.apply(group.members), group.groupProps)
        )
        .filter((target) => target.length > 0);
    } else {
      const { GroupBy, ...props } = this.props;
      const key = GroupBy.value.slice(1);
      const result = [];
      const groupMap = new Map();
      for (const button of /** @type {Button[]} */ (input)) {
        let k = button.access[key];
        if (!k) continue;
        k = k.toString();
        // we got a key, check to see if we have a group
        let group = groupMap.get(k);
        if (!group) {
          // no group, create one and add it to the map and the result
          group = new Group([button], props);
          groupMap.set(k, group);
          result.push(group);
        } else {
          group.members.push(button);
        }
      }
      return result;
    }
  }
}
PatternBase.register(GroupBy);

export class AccessPattern extends Base {
  template() {
    return html`<div class="access-pattern treebase">
      ${Globals.pattern.template()}
    </div>`;
  }
}

css`
  div.access-pattern {
    padding-left: 12px;
    padding-top: 12px;
  }
  .access-pattern .GroupBy details {
    display: inline-block;
    vertical-align: middle;
  }
  .access-pattern .GroupBy details[open] {
    display: inline-block;
    border: ridge;
    padding: 0.5em;
  }
  .access-pattern .GroupBy details summary {
    list-style: none;
    cursor: pointer;
    width: 1em;
    height: 1em;
    border: outset;
    vertical-align: middle;
  }
  .access-pattern .GroupBy details[open] summary {
    margin-left: calc(100% - 1em);
    margin-bottom: 0.2em;
    margin-top: -0.2em;
  }

  button[cue="group"] {
    position: relative;
    border-color: yellow;
  }
  button[cue="group"]:after {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: yellow;
    opacity: 0.3;
    z-index: 0;
  }
  button[cue="button"] {
    position: relative;
  }
  button[cue="button"]:after {
    content: "";
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("./target.png");
    background-size: contain;
    background-position: center;
    background-color: rgba(255, 100, 100, 0.5);
    background-repeat: no-repeat;
    opacity: 0.4;
    z-index: 0;
  }
`;
