export function StaggerContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`stagger-container ${className}`}>
      {children}
    </div>
  );
}

export function StaggerItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="stagger-item">
      {children}
    </div>
  );
}
