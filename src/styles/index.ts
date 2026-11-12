import css from "./widget.css";

// Les variables de thème sont posées sur le conteneur React (elles dépendent de GET /studio).
export const buildStyles = () => `:host{all:initial;display:block}\n${css}`;