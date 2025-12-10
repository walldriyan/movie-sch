
export default function Loading() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/5 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="flex space-x-2">
                <div className="h-3 w-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-3 w-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-3 w-3 bg-primary rounded-full animate-bounce"></div>
            </div>
        </div>
    );
}
