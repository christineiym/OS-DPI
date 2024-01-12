import { TreeBase, TreeBaseSwitchable } from "./treebase";

/** Implement undo/redo for the designer by comparing the current and previous trees
 *
 * I'm assuming only 1 change has been made since we save after every change.
 */

export class ChangeStack {
  /** @type {ExternalRep[]} */
  stack = [];

  /* boundary between undo and redo. Points to the first cell beyond the undos */
  top = 0;

  get canUndo() {
    return this.top > 1;
  }

  get canRedo() {
    return this.top < this.stack.length;
  }

  /** Save a state for possible undo
   * @param {ExternalRep} state
   */
  save(state) {
    this.stack.splice(this.top);
    this.stack.push(state);
    this.top = this.stack.length;
  }

  /** Undo
   * @param {TreeBase} current
   */
  undo(current) {
    if (this.canUndo) {
      this.restore(current, this.stack[this.top - 2]);
      this.top--;
    }
  }

  /** Redo
   * @param {TreeBase} current
   */
  redo(current) {
    if (this.canRedo) {
      this.restore(current, this.stack[this.top]);
      this.top++;
    }
  }

  /**
   * restore the state of current to previous
   * @param {TreeBase} current
   * @param {ExternalRep} previous
   * @returns {boolean}
   */
  restore(current, previous) {
    if (this.equal(current, previous)) {
      return false;
    }

    // we get here because the are different
    if (current.className != previous.className) {
      // I think this happens only for the components that dynamically change their class
      if (current instanceof TreeBaseSwitchable) {
        // switch the class and force the props to their old values
        current.replace(previous.className, previous.props);
      } else {
        throw new Error(
          `non switchable class changed ${current.className} ${previous.className}`,
        );
      }
      return true;
    }

    // check the props
    const pprops = previous.props;
    for (let propName in pprops) {
      if (
        pprops[propName] &&
        propName in current &&
        current[propName].text != pprops[propName]
      ) {
        current[propName].set(pprops[propName]);
        return true;
      }
    }

    // check the children
    const cc = current.children;
    const pc = previous.children;

    if (cc.length < pc.length) {
      // determine which one was deleted
      // it is a merge, first difference is the one that matters
      for (let i = 0; i < pc.length; i++) {
        if (!this.equal(cc[i], pc[i])) {
          // pc[i] is the one that got deleted. Create it
          const deleted = TreeBase.fromObject(pc[i], current);
          if (i < pc.length) {
            // move it
            deleted.moveTo(i);
          }
          return true;
        }
      }
      throw new Error("undo delete failed");
    } else if (cc.length > pc.length) {
      // the added one must be last
      current.children.splice(cc.length - 1, 1);
      return true;
    } else {
      // check for reordering
      let diffs = [];
      for (let i = 0; i < cc.length; i++) {
        if (!this.equal(cc[i], pc[i])) diffs.push(i);
      }
      if (diffs.length == 2) {
        // reordered
        current.swap(diffs[0], diffs[1]);
        return true;
      } else if (diffs.length == 1) {
        // changed
        return this.restore(cc[diffs[0]], pc[diffs[0]]);
      } else if (diffs.length == 0) {
        return true;
      } else {
        throw new Error("too many diffs");
      }
    }
  }

  /** Compare TreeBase and ExternalRep for equality
   * @param {TreeBase} tb - current value
   * @param {ExternalRep} er -- previous value
   * @returns {boolean}
   */
  equal(tb, er) {
    if (!tb || !er) return false;

    if (tb.className != er.className) return false;

    for (const prop in tb.props) {
      if (prop in er.props) {
        if (er.props[prop] && tb[prop].text != er.props[prop].toString())
          return false;
      }
    }

    if (tb.children.length != er.children.length) return false;

    return tb.children.every((child, i) => this.equal(child, er.children[i]));
  }
}
