// script.js Copy To Clipboard
function copyToClipboard() {
    const input = document.getElementById("myInput");
    navigator.clipboard.writeText(input.value).then(() => {
      alert("Email Copied!");
    }).catch(err => {
      console.error("Failed to copy: ", err);
    });
  }


// script.js Marquee
function Marquee(selector, speed) {
    const parentSelector = document.querySelector(selector);
    const clone = parentSelector.innerHTML;
    const firstElement = parentSelector.children[0];
    let i = 0;
    let marqueeInterval;
  
    parentSelector.insertAdjacentHTML('beforeend', clone);
    parentSelector.insertAdjacentHTML('beforeend', clone);
  
    function startMarquee() {
      marqueeInterval = setInterval(function () {
        firstElement.style.marginLeft = `-${i}px`;
        if (i > firstElement.clientWidth) {
          i = 0;
        }
        i = i + speed;
      }, 0);
    }
  
    function stopMarquee() {
      clearInterval(marqueeInterval);
    }
  
   parentSelector.addEventListener('mouseenter', stopMarquee);
    parentSelector.addEventListener('mouseleave', startMarquee);
  
    startMarquee();
  }
  
  window.addEventListener('load', () => Marquee('.marquee', 0.4));
  


// Timeline
window.addEventListener("DOMContentLoaded", () => {
        const ctl = new CollapsibleTimeline("#timeline");
      });

      class CollapsibleTimeline {
        constructor(el) {
          this.el = document.querySelector(el);

          this.init();
        }
        init() {
          this.el?.addEventListener("click", this.itemAction.bind(this));
        }
        animateItemAction(button, ctrld, contentHeight, shouldCollapse) {
          const expandedClass = "timeline__item-body--expanded";
          const animOptions = {
            duration: 300,
            easing: "cubic-bezier(0.65,0,0.35,1)",
          };

          if (shouldCollapse) {
            button.ariaExpanded = "false";
            ctrld.ariaHidden = "true";
            ctrld.classList.remove(expandedClass);
            animOptions.duration *= 2;
            this.animation = ctrld.animate(
              [
                { height: `${contentHeight}px` },
                { height: `${contentHeight}px` },
                { height: "0px" },
              ],
              animOptions
            );
          } else {
            button.ariaExpanded = "true";
            ctrld.ariaHidden = "false";
            ctrld.classList.add(expandedClass);
            this.animation = ctrld.animate(
              [{ height: "0px" }, { height: `${contentHeight}px` }],
              animOptions
            );
          }
        }
        itemAction(e) {
          const { target } = e;
          const action = target?.getAttribute("data-action");
          const item = target?.getAttribute("data-item");

          if (action) {
            const targetExpanded = action === "expand" ? "false" : "true";
            const buttons = Array.from(
              this.el?.querySelectorAll(`[aria-expanded="${targetExpanded}"]`)
            );
            const wasExpanded = action === "collapse";

            for (let button of buttons) {
              const buttonID = button.getAttribute("data-item");
              const ctrld = this.el?.querySelector(`#item${buttonID}-ctrld`);
              const contentHeight = ctrld.firstElementChild?.offsetHeight;

              this.animateItemAction(button, ctrld, contentHeight, wasExpanded);
            }
          } else if (item) {
            const button = this.el?.querySelector(`[data-item="${item}"]`);
            const expanded = button?.getAttribute("aria-expanded");

            if (!expanded) return;

            const wasExpanded = expanded === "true";
            const ctrld = this.el?.querySelector(`#item${item}-ctrld`);
            const contentHeight = ctrld.firstElementChild?.offsetHeight;

            this.animateItemAction(button, ctrld, contentHeight, wasExpanded);
          }
        }
      }

      // Disable right-click
      document.addEventListener("contextmenu", function (event) {
          event.preventDefault();
      });
      
      // Disable shortcut keys for Developer Tools
      document.addEventListener("keydown", function (event) {
          if (
              (event.ctrlKey && event.key === "u") ||  // Ctrl + U (View Source)
              (event.ctrlKey && event.shiftKey && event.key === "I") ||  // Ctrl + Shift + I (Inspect Element)
              (event.ctrlKey && event.shiftKey && event.key === "J") ||  // Ctrl + Shift + J (Console)
              (event.key === "F12")  // F12 (DevTools)
          ) {
              event.preventDefault();
          }
      });
      
      // Detect if Developer Tools are open and take action
      let devtoolsOpen = false;
      setInterval(function () {
          const widthDiff = window.outerWidth - window.innerWidth > 160;
          const heightDiff = window.outerHeight - window.innerHeight > 160;
          
          if (widthDiff || heightDiff) {
              if (!devtoolsOpen) {
                  console.clear();
                  devtoolsOpen = true;
              }
          } else {
              devtoolsOpen = false;
          }
      }, 500);

