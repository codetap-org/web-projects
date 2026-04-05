import React, { useState, useEffect } from "https://esm.sh/react@19";
import { createRoot } from "https://esm.sh/react-dom@19/client";
import { motion, AnimatePresence } from "https://esm.sh/motion/react";
import { Wifi, Signal, BatteryFull, Search, Pencil, Languages, Bell, MoveLeft } from "https://esm.sh/lucide-react";

const USER_PHOTO = 'https://images.unsplash.com/photo-1658104917506-67c6e95f1dfe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NzQ5ODQ5MjF8&ixlib=rb-4.1.0&q=80&w=400';


const Avatar = ({ width = 40, isOpen }) => {
  const rotateY = isOpen ? -180 : 0;
  const borderRadius = 8;

  return /*#__PURE__*/(
    React.createElement(motion.div, {
      className: "transform-3d perspective-midrange",
      style: { width },
      layoutId: "avatar" }, /*#__PURE__*/

    React.createElement(motion.div, {
      className: "w-full h-full relative transform-3d",
      transition: { type: 'spring', bounce: 0.2, duration: 1 },
      initial: { rotateY: 0 },
      animate: { rotateY },
      exit: { rotateY: 0 } }, /*#__PURE__*/


    React.createElement(motion.div, {
      className: "absolute inset-0 p-4 h-fit bg-neutral-50 backface-hidden rotate-y-180 flex gap-4 overflow-hidden text-sm",
      style: { borderRadius } }, /*#__PURE__*/

    React.createElement("div", { className: "flex flex-col items-center gap-2" }, /*#__PURE__*/
    React.createElement(motion.img, {
      className: "w-25 aspect-square object-cover rounded-md",
      src: USER_PHOTO,
      alt: "avatar" }), /*#__PURE__*/
    React.createElement("div", null, "Something here")), /*#__PURE__*/

    React.createElement("div", { className: "flex-1 flex flex-col gap-2 text-neutral-400 leading-[1.1]" }, /*#__PURE__*/
    React.createElement("div", { className: "" }, "ID", /*#__PURE__*/

    React.createElement("br", null), /*#__PURE__*/
    React.createElement("span", { className: "text-blue-600" }, "14285777")), /*#__PURE__*/

    React.createElement("div", { className: "" }, "Name", /*#__PURE__*/

    React.createElement("br", null), /*#__PURE__*/
    React.createElement("span", { className: "text-blue-600" }, "Someone")), /*#__PURE__*/

    React.createElement("div", { className: "" }, "ID", /*#__PURE__*/

    React.createElement("br", null), /*#__PURE__*/
    React.createElement("span", { className: "text-blue-600" }, "14285777")))), /*#__PURE__*/





    React.createElement(motion.img, {
      className: "object-cover backface-hidden",
      style: { borderRadius, width: 40, height: 32 },
      src: USER_PHOTO,
      alt: "avatar" }))));




};

const App = () => {
  const [isOpen, setIsOpen] = useState(false);

  return /*#__PURE__*/(
    React.createElement("div", { className: "text-neutral-800 m-6 relative" }, /*#__PURE__*/
    React.createElement("div", { className: "w-70 aspect-1/2 rounded-4xl border border-neutral-400/20 shadow-lg bg-blue-100/50 relative overflow-hidden" }, /*#__PURE__*/

    React.createElement("div", { className: "h-10 px-6 flex items-center justify-between relative" }, /*#__PURE__*/
    React.createElement("div", { className: "text-sm" }, "07:26"), /*#__PURE__*/
    React.createElement("div", { className: "absolute inset-0 m-auto w-1/3 h-6 rounded-full bg-neutral-900" }), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1" }, /*#__PURE__*/
    React.createElement(Signal, { size: 14 }), /*#__PURE__*/
    React.createElement(Wifi, { size: 14 }), /*#__PURE__*/
    React.createElement(BatteryFull, { size: 14 }))), /*#__PURE__*/




    React.createElement("div", { className: "px-3 py-2 mt-2 flex items-center gap-4" }, /*#__PURE__*/
    React.createElement("div", { className: "flex-1 h-8 px-4 flex items-center gap-2 bg-neutral-50 rounded-full opacity-50 shadow-sm" }, /*#__PURE__*/
    React.createElement(Search, { size: 16 }), /*#__PURE__*/
    React.createElement("div", { className: "text-sm" }, "Search")), /*#__PURE__*/

    React.createElement("div", { className: "cursor-pointer", onClick: () => setIsOpen(true) }, /*#__PURE__*/
    React.createElement(Avatar, { width: 40, isOpen: isOpen }))), /*#__PURE__*/




    React.createElement("div", { className: "px-4 py-2 h-30 flex items-center gap-4" }, /*#__PURE__*/
    React.createElement("div", { className: "text-2xl font-(family-name:--font-flower)" }, "Hello,", /*#__PURE__*/

    React.createElement("br", null), "how can I help you today?")), /*#__PURE__*/




    React.createElement("img", {
      className: "absolute bottom-0 left-0 right-0 object-cover mask-[linear-gradient(transparent,#000_30%)] opacity-50 contrast-80",
      src: "https://images.unsplash.com/photo-1530092285049-1c42085fd395?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NzQ5ODMzOTd8&ixlib=rb-4.1.0&q=80&w=400",
      alt: "" }), /*#__PURE__*/


    React.createElement(AnimatePresence, null,
    isOpen && /*#__PURE__*/
    React.createElement(React.Fragment, null, /*#__PURE__*/
    React.createElement(motion.div, {
      className: "absolute inset-0 bg-neutral-500/30 backdrop-blur-[1px]",
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { type: 'spring', bounce: 0, duration: 0.5 },
      onClick: () => setIsOpen(false) }), /*#__PURE__*/


    React.createElement("div", {
      className: "p-4 pt-8 font-(family-name:--font-flower)",
      style: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '66%', display: 'flex', flexDirection: 'column', alignItems: 'center' } }, /*#__PURE__*/

    React.createElement(motion.div, {
      initial: { y: 400 },
      animate: { y: 0 },
      exit: { y: 400 },
      transition: { type: 'spring', bounce: 0, duration: 0.5 },
      className: "absolute inset-0 rounded-t-3xl bg-blue-50/80 flex flex-col items-center gap-2 text-sm" }, /*#__PURE__*/

    React.createElement("div", { className: "w-16 h-1 mt-3 mx-auto rounded-full bg-neutral-50/80" }), /*#__PURE__*/
    React.createElement("div", { className: "mt-50 underline opacity-70 flex items-center gap-1" }, /*#__PURE__*/
    React.createElement(Pencil, { size: 13 }), "edit your profile"), /*#__PURE__*/


    React.createElement("div", { className: "underline opacity-70 flex items-center gap-1" }, /*#__PURE__*/
    React.createElement(Bell, { size: 13 }), "notifications"), /*#__PURE__*/


    React.createElement("div", { className: "underline opacity-70 flex items-center gap-1" }, /*#__PURE__*/
    React.createElement(Languages, { size: 13 }), "change language")), /*#__PURE__*/




    React.createElement(Avatar, { width: 240, isOpen: isOpen }))))), /*#__PURE__*/







    React.createElement(AnimatePresence, null,
    !isOpen && /*#__PURE__*/
    React.createElement(motion.div, {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
      className: "absolute top-15 left-full ml-4 flex items-center gap-1 font-(family-name:--font-flower) text-blue-800 whitespace-nowrap" }, /*#__PURE__*/
    React.createElement(MoveLeft, { size: 14 }), "click the avatar"))));






};

const root = createRoot(document.getElementById("app"));

root.render( /*#__PURE__*/React.createElement(App, null));