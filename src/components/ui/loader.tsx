import React from 'react';

const Loader = () => {
  return (
    <>
      <style>{`
        .my-custom-loader {
          --path: #2f3545;
          --dot: #5628ee;
          --duration: 3s;
          width: 44px;
          height: 44px;
          position: relative;
          display: inline-block;
          margin: 0 16px;
        }

        .my-custom-loader:before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          position: absolute;
          display: block;
          background: var(--dot);
          top: 37px;
          left: 19px;
          transform: translate(-18px, -18px);
          animation: dotRect var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
        }

        .my-custom-loader svg {
          display: block;
          width: 100%;
          height: 100%;
        }

        .my-custom-loader svg circle {
          fill: none;
          stroke: var(--path);
          stroke-width: 10px;
          stroke-linejoin: round;
          stroke-linecap: round;
          stroke-dasharray: 150 50 150 50;
          stroke-dashoffset: 75;
          animation: pathCircle var(--duration) cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite;
        }

        @keyframes dotRect {
          25% { transform: translate(0, 0); }
          50% { transform: translate(18px, -18px); }
          75% { transform: translate(0, -36px); }
          100% { transform: translate(-18px, -18px); }
        }

        @keyframes pathCircle {
          25% { stroke-dashoffset: 125; }
          50% { stroke-dashoffset: 175; }
          75% { stroke-dashoffset: 225; }
          100% { stroke-dashoffset: 275; }
        }
      `}</style>
      <div className="my-custom-loader">
        <svg viewBox="0 0 80 80">
          <circle r={32} cy={40} cx={40} id="test" />
        </svg>
      </div>
    </>
  );
};

export default Loader;
