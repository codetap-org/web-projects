import React, { useState, useEffect } from "https://esm.sh/react@19";
import { createRoot } from "https://esm.sh/react-dom@19/client";
import { motion, AnimatePresence } from "https://esm.sh/motion/react";
import { LoaderCircle } from "https://esm.sh/lucide-react";

const buttonCopy = {
  idle: 'Check for updates 👀',
  loading: /*#__PURE__*/React.createElement(LoaderCircle, { className: "animate-spin" }),
  success: 'All up to date ✨' };



const App = () => {
  const [buttonState, setButtonState] = useState('idle');

  const onButtonClick = async () => {
    if (buttonState !== 'idle') return;

    setButtonState('loading');

    await new Promise(r => setTimeout(r, 1500));
    setButtonState('success');

    await new Promise(r => setTimeout(r, 3000));
    setButtonState('idle');
  };

  return /*#__PURE__*/(
    React.createElement("div", { className: "text-[#222] text-xl font-medium" }, /*#__PURE__*/

    React.createElement("div", {
      className: "w-64 h-12 rounded-full relative glass-btn bg-gray-100/50 text-shadow-lg text-shadow-gray-300/30 transition-transform active:scale-98 select-none cursor-pointer",
      onClick: onButtonClick }, /*#__PURE__*/


    React.createElement("div", { className: "w-full h-full relative grid place-content-center overflow-hidden" }, /*#__PURE__*/
    React.createElement(AnimatePresence, { mode: "popLayout", initial: false }, /*#__PURE__*/
    React.createElement(motion.span, {
      className: "whitespace-nowrap",
      transition: { type: 'spring', duration: 0.3, bounce: 0 },
      initial: { opacity: 0, y: 48 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -48 },
      key: buttonState },
    buttonCopy[buttonState]))))));







};

const root = createRoot(document.getElementById("app"));

root.render( /*#__PURE__*/React.createElement(App, null));