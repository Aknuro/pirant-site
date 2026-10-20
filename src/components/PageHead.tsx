export default function PageHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="bg-navy py-12 text-white">
      <div className="container-site">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {sub && <p className="mt-3 max-w-2xl text-white/75">{sub}</p>}
      </div>
    </div>
  );
}
