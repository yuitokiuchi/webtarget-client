// src/routes/Loading.tsx

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center space-y-6">
        
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
        
      
        <div className="text-black text-sm font-normal tracking-wide">
          Loading...
        </div>
      </div>
    </div>
  );
}
