import { TreeBase } from "../../treebase.js";
import { Handler, HandlerCondition } from "./handler.js";
import { HandlerResponse } from "./responses.js";
import { Select } from "../../props.js";
import { html } from "../../../_snowpack/pkg/uhtml.js";
import { Subject, switchMap, delay, takeUntil, of, EMPTY } from "../../../_snowpack/pkg/rxjs.js";
import { Method } from "./index.js";

const timerSignals = new Map([
  ["transitionend", "Transition end"],
  ["timer", "Timer complete"],
]);

export class TimerHandler extends Handler {
  Signal = new Select(timerSignals);
  TimerName = new Select([], { hiddenLabel: true });

  template() {
    const { conditions, responses, Signal } = this;
    const timerNames = this.nearestParent(Method).timerNames;
    return html`
      <fieldset class="Handler">
        <legend>Timer Handler</legend>
        ${Signal.input()} ${this.TimerName.input(timerNames)}
        ${this.deleteButton({ title: "Delete this handler" })}
        <fieldset class="Conditions">
          <legend>
            Conditions
            ${this.addChildButton("+", HandlerCondition, {
              title: "Add a condition",
            })}
          </legend>
          ${this.unorderedChildren(conditions)}
        </fieldset>
        <fieldset class="Responses">
          <legend>
            Responses
            ${this.addChildButton("+", HandlerResponse, {
              title: "Add a response",
            })}
          </legend>
          ${this.unorderedChildren(responses)}
        </fieldset>
      </fieldset>
    `;
  }

  /** @param {Subject} stop$ */
  configure(stop$) {
    const timer = this.nearestParent(Method).timer(this.TimerName.value);
    if (!timer) return;
    const delayTime = 1000 * timer.Interval.valueAsNumber;
    timer.subject$
      .pipe(
        switchMap((event) =>
          event.type == "cancel" ? EMPTY : of(event).pipe(delay(delayTime))
        ),
        takeUntil(stop$)
      )
      .subscribe((e) => this.respond(e));
  }
}
TreeBase.register(TimerHandler);