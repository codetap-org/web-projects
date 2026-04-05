import React, { useState, useEffect } from "https://esm.sh/react@19";
import { createRoot } from "https://esm.sh/react-dom@19/client";
import { motion, Reorder, resize } from "https://esm.sh/motion/react";

const whileDrag = {
  scale: 1.05,
  boxShadow: '0 6px 15px rgba(0,0,0,0.2)',
  zIndex: 10 };


const CardOne = ({ layer }) => {
  return /*#__PURE__*/(
    React.createElement(Reorder.Item, {
      value: layer,
      whileDrag: whileDrag
      //  added `touch-none` to improve drag behavior on mobile
      , className: "max-w-full w-50 aspect-3/2 bg-[#f0e7d6] shadow-sm flex items-center justify-center relative whitespace-nowrap tracking-wider uppercase touch-none cursor-grab transition-[box-shadow]" }, /*#__PURE__*/
    React.createElement("div", { className: "text-3xl font-(family-name:--font-bricolage) lowercase font-semibold" }, "f"), /*#__PURE__*/

    React.createElement("div", { className: "absolute left-4 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 scale-60 font-semibold text-xs" }, "founder"), /*#__PURE__*/
    React.createElement("div", { className: "absolute right-4 top-1/2 translate-x-1/2 -translate-y-1/2 rotate-90 scale-60 font-semibold text-xs" }, "creative director"), /*#__PURE__*/

    React.createElement("div", { className: "absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold tracking-widest scale-80" }, "alicia potter"), /*#__PURE__*/
    React.createElement("div", { className: "absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-semibold scale-60" }, "helo@creative.com")));


};

const CardTwo = ({ layer }) => {
  return /*#__PURE__*/(
    React.createElement(Reorder.Item, {
      value: layer,
      whileDrag: whileDrag,
      className: "max-w-full w-50 aspect-3/2 bg-[#eed4cd] shadow-sm flex items-center justify-center text-center cursor-grab transition-[box-shadow]" }, /*#__PURE__*/
    React.createElement("div", { className: "text-3xl font-(family-name:--font-bricolage) font-semibold leading-[0.8] tracking-tight" }, "faven", /*#__PURE__*/

    React.createElement("br", null), "creative")));




};

const App = () => {
  const [items, setItems] = useState(
  Array.from({ length: 4 }, (_, i) => ({
    id: i,
    type: i % 2 === 0 ? "one" : "two" })));


  const [axis, setAxis] = useState('x');

  useEffect(() => {
    const unsubscribe = resize(({ width }) => {
      setAxis(width < 768 ? 'y' : 'x');
    });
    return () => unsubscribe();
  }, []);

  return /*#__PURE__*/(
    React.createElement(React.Fragment, null, /*#__PURE__*/
    React.createElement(Reorder.Group, {
      axis: axis,
      values: items,
      onReorder: setItems,
      className: "grid md:grid-cols-4 gap-8" },

    items.map((item) =>
    item.type === 'one' ? /*#__PURE__*/
    React.createElement(CardOne, { key: item.id, layer: item }) : /*#__PURE__*/
    React.createElement(CardTwo, { key: item.id, layer: item }))), /*#__PURE__*/




    React.createElement("div", { className: "fixed -top-6 -right-6 w-full h-[110dvh] bg-[linear-gradient(225deg,#36100c65_33%,transparent_0)] blur-md pointer-events-none z-50" })));


};

const root = createRoot(document.getElementById("app"));

root.render( /*#__PURE__*/React.createElement(App, null));