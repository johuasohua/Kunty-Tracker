export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between px-4 pt-4 md:px-0">
      <h1 className="text-[28px] font-bold tracking-tight text-ios-label md:text-[32px]">
        {title}
      </h1>
      {action}
    </div>
  );
}
