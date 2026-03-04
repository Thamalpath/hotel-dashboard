import { Card, CardHeader } from "@/components/ui/card";

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 items-stretch">
        {[
          "Total Books",
          "Total Users",
          "Total Online Orders",
          "Total POS Sales",
        ].map((t, i) => (
          <Card key={i} className="h-[160px]">
            <CardHeader>
              <div className="text-sm text-neutral-500">{t}</div>
              <div className="mt-3 text-3xl font-semibold">
                {[635, 48, 56050, 136][i].toLocaleString()}
              </div>
              <div
                className={
                  "mt-2 inline-flex px-2 py-0.5 rounded-full text-xs " +
                  (i % 2 === 0
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300")
                }
              >
                {["+54.6%", "+22.1%", "+22.2%", "-2.5%"][i]}
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
