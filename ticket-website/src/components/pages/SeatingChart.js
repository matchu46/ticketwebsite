import React, { useState, useEffect, useRef } from 'react';
import './SeatingChart.css';

const SeatingChart = ({ onSelectSection }) => {
  const [svgContent, setSvgContent] = useState(null);
  const [hoveredSection, setHoveredSection] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null); // Track selected section
  const containerRef = useRef(null);

  useEffect(() => {
    fetch('/images/footprint_seating_chart.svg')
      .then((res) => res.text())
      .then((data) => setSvgContent(data))
      .catch((err) => console.error('Error loading SVG:', err));
  }, []);

  useEffect(() => {
    if (!svgContent) return;
    const container = containerRef.current;
    if (!container) return;

    setTimeout(() => {
      const paths = container.querySelectorAll('path');

      paths.forEach((path) => {
        path.style.cursor = 'pointer'; // Indicate interactivity

        path.addEventListener('mouseenter', (e) => setHoveredSection(e.target.id));
        path.addEventListener('mouseleave', () => setHoveredSection(null));

        path.addEventListener('click', (e) => {
          const sectionId = e.target.id;
          console.log(`Clicked on section: ${sectionId}`);

          // Toggle selection logic
          if (selectedSection === sectionId) {
            setSelectedSection(null); // Deselect
            onSelectSection(null); // Show all tickets
          } else {
            setSelectedSection(sectionId); // Select new section
            onSelectSection(sectionId); // Show filtered tickets
          }
        });
      });

      return () => {
        paths.forEach((path) => {
          path.removeEventListener('mouseenter', (e) => setHoveredSection(e.target.id));
          path.removeEventListener('mouseleave', () => setHoveredSection(null));
          path.removeEventListener('click', (e) => onSelectSection(e.target.id));
        });
      };
    }, 500); // Delay to ensure SVG is fully loaded
  }, [svgContent, selectedSection, onSelectSection]);

  return (
    <div className="seating-chart-container">
      {svgContent ? (
        <div
          ref={containerRef}
          className="seating-chart-svg"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      ) : (
        <p>Loading seating chart...</p>
      )}
      {/* {selectedSection && <h2>Showing tickets for Section {selectedSection}</h2>} */}
    </div>
  );
};

export default SeatingChart;
