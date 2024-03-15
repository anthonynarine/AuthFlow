import React from 'react';
import "./Home.css"

function HomePage() {
  return (
    <div className="cover-container d-flex w-100 h-100 p-3 mx-auto flex-column">
      <header className="mb-auto">
        <div className="header-container"> {/* Wrap with header-container div */}
          <h3 className="mb-0 white-text">Authentication </h3>
          <nav className="nav nav-masthead justify-content-center"> {/* Remove float-md-end class */}
            <a className="nav-link fw-bold py-1 px-3 active white-text" aria-current="page" href="#">Home</a> {/* Add padding */}
            <a className="nav-link fw-bold py-1 px-3 white-text " href="#">Features</a> {/* Add padding */}
            <a className="nav-link fw-bold py-1 px-3 white-text " href="#">Contact</a> {/* Add padding */}
          </nav>
        </div>
      </header>

      <main className="px-3 main-container" >
        <h1 className='white-text' >Cover your page.</h1>
        <p className="lead white-text">Cover is a one-page template for building simple and beautiful home pages. Download, edit the text, and add your own fullscreen background photo to make it your own.</p>
        <p className="lead">
        </p>
      </main>

      <footer className="mt-auto text-white-50 footer-container">
        <p>Cover template for <a href="https://getbootstrap.com/" className="text-white">Bootstrap</a>, by <a href="https://twitter.com/mdo" className="text-white">@mdo</a>.</p>
    </footer>
    </div>
  );
}

export default HomePage;
