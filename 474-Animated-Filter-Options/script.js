import React, { useState } from "https://esm.sh/react@19";
import { createRoot } from "https://esm.sh/react-dom@19/client";
import { motion, AnimatePresence } from "https://esm.sh/motion/react";
import { LayoutGrid, Rabbit, Brush, Sparkles } from "https://esm.sh/lucide-react";

const ITEMS = [
{ name: 'Cartoon', icon: /*#__PURE__*/React.createElement(Rabbit, null) },
{ name: 'Pixel', icon: /*#__PURE__*/React.createElement(LayoutGrid, null) },
{ name: 'Watercolor', icon: /*#__PURE__*/React.createElement(Brush, null) },
{ name: 'Random', icon: /*#__PURE__*/React.createElement(Sparkles, null) }];


const App = () => {
  const [activeIndex, setActiveIndex] = useState(3);

  return /*#__PURE__*/(
    React.createElement("div", {
      role: "radiogroup",
      className: "text-neutral-800 text-2xl flex items-center gap-4" },

    ITEMS.map((el, i) => {
      const checked = activeIndex === i;
      return /*#__PURE__*/(
        React.createElement("label", { key: el.name, className: "cursor-pointer" }, /*#__PURE__*/
        React.createElement("input", {
          type: "radio",
          name: "style",
          value: el.name,
          checked: checked,
          onChange: () => setActiveIndex(i),
          className: "sr-only" }), /*#__PURE__*/


        React.createElement(motion.div, {
          layout: true,
          transition: { type: 'spring', visualDuration: 0.3, bounce: 0.3 },
          className: `px-4 h-12 flex justify-center items-center gap-3 overflow-hidden relative transition-colors ${
          checked ?
          'text-rose-500 bg-rose-200/75' :
          'text-rose-300 bg-neutral-200'
          }`,
          style: { borderRadius: 99 } }, /*#__PURE__*/

        React.createElement(motion.span, { layout: true, className: "shrink-0" },
        el.icon), /*#__PURE__*/


        React.createElement(AnimatePresence, { mode: "popLayout", initial: false },
        checked && /*#__PURE__*/
        React.createElement(motion.div, {
          layout: true,
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 } },

        el.name)))));






    })));


};

const root = createRoot(document.getElementById("app"));
root.render( /*#__PURE__*/React.createElement(App, null));