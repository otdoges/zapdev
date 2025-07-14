import { motion } from "framer-motion";
interface FeatureContentProps {
  image: string;
  title: string;
}
export const FeatureContent = ({
  image,
  title
}: FeatureContentProps) => {
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.5
  }} className="h-full flex items-center justify-center">
      <div className="glass rounded-xl overflow-hidden w-full relative bg-transparent">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div style={{
        width: '100%',
        height: '100%',
        padding: '51.88px',
        background: 'rgba(255, 255, 255, 0.04)',
        borderRight: '1.30px rgba(255, 255, 255, 0.08) solid'
      }} className="relative z-10 bg-transparent">
          <img src="/lovable-uploads/6d294202-dfa7-4f01-8220-87b42fca6d42.png" alt={title} className="w-full h-full object-contain" />
        </div>
      </div>
    </motion.div>;
};