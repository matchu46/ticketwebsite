// import React, { useState } from 'react';
// import './SeatingChart.css';

// const SeatingChart = ({ onSelectSection }) => {
//     const [hoveredSection, setHoveredSection] = useState(null);

//     const handleMouseEnter = (sectionId) => {
//         setHoveredSection(sectionId);
//     };

//     const handleMouseLeave = () => {
//         setHoveredSection(null);
//     };

//     const handleClick = (sectionId) => {
//         onSelectSection(sectionId);
//     };

//     return (
//         <svg
//             viewBox="0 0 800 600"
//             className="seating-chart-svg"
//         >
//             {/* Example sections (Replace with actual SVG paths and IDs) */}
//             <g
//                 id="210"
//                 className={`seat-section ${hoveredSection === "210" ? "hovered" : ""}`}
//                 onMouseEnter={() => handleMouseEnter("210")}
//                 onMouseLeave={handleMouseLeave}
//                 onClick={() => handleClick("210")}
//             >
//                 <rect x="100" y="100" width="100" height="50" fill="blue" />
//             </g>
//             <g
//                 id="211"
//                 className={`seat-section ${hoveredSection === "211" ? "hovered" : ""}`}
//                 onMouseEnter={() => handleMouseEnter("211")}
//                 onMouseLeave={handleMouseLeave}
//                 onClick={() => handleClick("211")}
//             >
//                 <rect x="250" y="100" width="100" height="50" fill="green" />
//             </g>
//         </svg>
//     );
// };

// export default SeatingChart;
import React, { useState, useEffect, useRef } from 'react';
import './SeatingChart.css';

const SeatingChart = ({ onSelectSection }) => {
  const [svgContent, setSvgContent] = useState(null);
  const [hoveredSection, setHoveredSection] = useState(null);
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

    // Wait for SVG to render in the DOM
    setTimeout(() => {
      const paths = container.querySelectorAll('path');

      paths.forEach((path) => {
        path.style.cursor = 'pointer'; // Make it clear that sections are clickable

        path.addEventListener('mouseenter', (e) => setHoveredSection(e.target.id));
        path.addEventListener('mouseleave', () => setHoveredSection(null));
        path.addEventListener('click', (e) => {
          const sectionId = e.target.id;
          console.log(`Clicked on section: ${sectionId}`);
          if (onSelectSection) onSelectSection(sectionId);
        });
      });

      return () => {
        paths.forEach((path) => {
          path.removeEventListener('mouseenter', (e) => setHoveredSection(e.target.id));
          path.removeEventListener('mouseleave', () => setHoveredSection(null));
          path.removeEventListener('click', (e) => onSelectSection(e.target.id));
        });
      };
    }, 500); // Delay to ensure the SVG is fully loaded
  }, [svgContent, onSelectSection]);

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
      {/* {hoveredSection && <div className="hover-indicator">Hovering: {hoveredSection}</div>} */}
    </div>
  );
};

export default SeatingChart;



