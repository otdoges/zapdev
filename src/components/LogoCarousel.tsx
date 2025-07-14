import { motion } from "framer-motion";
const LogoCarousel = () => {
  const logos = ["/lovable-uploads/5830bd79-3511-41dc-af6c-8db32d91fc2c.png", "/lovable-uploads/bb50362c-6879-4868-bbc9-c6e051fd8d7d.png", "/lovable-uploads/1e2a48dc-059b-4919-a1ed-44685d771a32.png", "/lovable-uploads/bf56a0c6-48e4-49f7-b286-8e3fda9a3385.png", "/lovable-uploads/7cc724d4-3e14-4e7c-9e7a-8d613fde54d0.png"];
  const extendedLogos = [...logos, ...logos, ...logos];
  return <div className="w-full overflow-hidden bg-background/50 backdrop-blur-sm py-12 mt-20 bg-transparent">
      <motion.div className="flex space-x-16" initial={{
      opacity: 0,
      x: "0%"
    }} animate={{
      opacity: 1,
      x: "-50%"
    }} transition={{
      opacity: {
        duration: 0.5
      },
      x: {
        duration: 15,
        // Reduced from 25 to 15 seconds
        repeat: Infinity,
        ease: "linear",
        delay: 0.5
      }
    }} style={{
      width: "fit-content",
      display: "flex",
      gap: "4rem"
    }}>
        {extendedLogos.map((logo, index) => <motion.img key={`logo-${index}`} src={logo} alt={`Partner logo ${index + 1}`} className="h-8 object-contain" initial={{
        opacity: 0.5
      }} whileHover={{
        opacity: 1,
        scale: 1.05,
        transition: {
          duration: 0.2
        }
      }} />)}
      </motion.div>
    </div>;
};
export default LogoCarousel;