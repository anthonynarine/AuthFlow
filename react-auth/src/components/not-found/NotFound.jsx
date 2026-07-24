import { Link } from "react-router-dom";
import "./NotFound.css";

export const NotFound = () => {
  return (
    <div className="not-found-page">
      <p className="not-found-code">404</p>
      <h1>This page doesn't exist.</h1>
      <p className="not-found-body">
        The page you're looking for was moved or never existed. Head back and try again.
      </p>
      <Link to="/" className="btn-pill btn-pill-primary">Back to home</Link>
    </div>
  );
};

export default NotFound;
