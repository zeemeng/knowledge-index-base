import Component from "../../lib/breeze/index.js";
import Section from "../../models/Section.js";
import { actionTypes } from "../../store/actions.js";
import store from "../../store/store.js";
import validateElementId from "../utils/validateElementId.js";

export class KiSection extends Component {
  static tagName = "ki-section";

  static styleSheetPaths = [
    "/src/components/ki-common-styles/ki-component-styles.css",
    "/src/components/ki-section/ki-section.css"
  ];

  static template = `
  <div class="topic-toc">
    <div class="topic-toc-container">
      <a class="topic-toc-heading"  id="section_id-toc" href="#section_id-toc">Table of Contents</a>
      <ki-toc></ki-toc>
    </div>
  </div>
  <slot></slot>
  `;

  static observedAttributes = ["name", "long-name", "id", "no-toc"];

  static init = this.initClass();

  attributeChangedCallback(attributeName, oldValue, newValue) {
    if (oldValue === newValue) return;

    // Remove the TOC if "no-toc" attribute is specified
    if (attributeName === "no-toc") this.shadowRoot.querySelector(".topic-toc").remove();

    // Update table of contents related attributes
    if (attributeName === "id" && !this.getAttribute("no-toc")) {
      setTimeout(() => {
        this.shadowRoot.querySelector("ki-toc")?.setAttribute("section", newValue);
        this.shadowRoot.querySelector(".topic-toc-heading")?.setAttribute("id", newValue + "-toc");
        this.shadowRoot
          .querySelector(".topic-toc-heading")
          ?.setAttribute("href", "#" + newValue + "-toc");
      });
    }

    // Update store value related to the current section
    if (!this.storeSubscription) return;
    const oldSection = this.state.sections.find(
      section => section.id === (attributeName === "id" ? oldValue : this.id)
    );
    let { id, name, longName } = oldSection;
    if (attributeName === "id") id = newValue;
    if (attributeName === "name") name = newValue;
    if (attributeName === "long-name") longName = newValue;
    const newSection = new Section(id, name, longName);
    store.dispatch(actionTypes.updateSection, { oldSection, newSection });
  }

  connectedCallback() {
    validateElementId(this); // Validates the element's id and autogenerate one if not present.
    this.storeSubscription = store.subscribe(state => this.setState(state));
    store.dispatch(actionTypes.updateSection, {
      oldSection: null,
      newSection: new Section(this.id, this.getAttribute("name"), this.getAttribute("long-name"))
    });
  }

  disconnectedCallback() {
    this.storeSubscription.unsubscribe();
    store.dispatch(actionTypes.removeSection, this.id);
  }

  render() {
    if (this.state.activeSection?.id === this.id && this.style.display === "none")
      this.style.removeProperty("display");
    if (this.state.activeSection?.id !== this.id && this.style.display !== "none")
      this.style.display = "none";
  }
}
