import { html, render } from "uhtml";
import css from "ustyler";

/**
 * Handle displaying a "please wait" message and error reporting for
 * async functions that may take a while or throw errors
 * @template T
 * @param {Promise<T>} promise
 * @param {string} message
 * @returns {Promise<T>}
 */
export default async function wait(promise, message = "Please wait") {
  const div = document.createElement("div");
  div.id = "PleaseWait";
  document.body.appendChild(div);
  const timer = window.setTimeout(
    () => render(div, html`<div><p class="message">${message}</p></div>`),
    500
  );
  try {
    const result = await promise;
    clearTimeout(timer);
    div.remove();
    return result;
  } catch (e) {
    clearTimeout(timer);
    return new Promise((resolve) =>
      render(
        div,
        html`<div>
          <p class="error">${e.message}</p>
          <button
            onclick=${() => {
              div.remove();
              resolve(e.message);
            }}
          >
            OK
          </button>
        </div>`
      )
    );
  }
}

css`
  #PleaseWait {
    position: fixed;
    width: 100vw;
    height: 100vh;
    background-color: rgb(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    font-size: 2em;
    transition: all 0.5s ease-in;
    opacity: 1;
  }

  #PleaseWait:empty {
    background-color: rgb(0, 0, 0, 0);
    opacity: 0;
  }

  #PleaseWait div {
    padding: 5em;
    border: 1px solid black;
    background-color: white;
  }

  #PleaseWait .message {
    color: blue;
  }

  #PleaseWait .error {
    color: red;
  }
`;
