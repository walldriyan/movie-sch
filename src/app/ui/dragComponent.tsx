import { useMotionValue, useTransform } from "framer-motion"

export default function CC_13_Drag_Transform(props) {
    const x = useMotionValue(0)
    const scale = useTransform(x, [-150, 150], [1.5, 0.5])
    const rotate = useTransform(x, [-150, 150], [-90, 90])

    return (
        <div>
            <motion.div
                style={{
                    width: 150,
                    height: 150,
                    borderRadius: 30,
                    backgroundColor: "#fff",
                    x,
                    scale,
                    rotate,
                    cursor: "grab",
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
                whileTap={{ cursor: "grabbing" }}
            />
        </div>
    )
}