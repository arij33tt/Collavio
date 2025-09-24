import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home-hero">
      <div className="home-hero-inner">
        <h1 className="home-title">Video Collaborator</h1>
        <p className="home-subtitle">Review, version, and publish your videos seamlessly to your YouTube Clone channel.</p>
        <div className="home-cta">
          <Link to="/login" className="btn btn-primary">Get Started</Link>
          <Link to="/signup" className="btn btn-secondary">Create an account</Link>
        </div>
        <div className="home-highlights">
          <div className="hi">• Versioned uploads</div>
          <div className="hi">• Timestamped feedback</div>
          <div className="hi">• One-click publish</div>
        </div>
      </div>
    </div>
  );
}