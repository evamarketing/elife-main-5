import { Link } from "react-router-dom";
import { 
  Leaf, 
  Apple, 
  UtensilsCrossed, 
  Briefcase, 
  Baby, 
  HeartHandshake, 
  ShoppingBag,
  ArrowRight 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const divisions = [
  {
    id: "farmelife",
    name: "Farmelife",
    nameMl: "ഫാർമെലൈഫ്",
    description: "Agricultural initiatives and farming support for women",
    icon: Leaf,
    color: "bg-division-farmelife",
  },
  {
    id: "organelife",
    name: "Organelife",
    nameMl: "ഓർഗനെലൈഫ്",
    description: "Organic farming and sustainable agriculture programs",
    icon: Apple,
    color: "bg-division-organelife",
  },
  {
    id: "foodelife",
    name: "Foodelife",
    nameMl: "ഫുഡെലൈഫ്",
    description: "Food processing and culinary entrepreneurship",
    icon: UtensilsCrossed,
    color: "bg-division-foodelife",
  },
  {
    id: "entrelife",
    name: "Entrelife",
    nameMl: "എന്ററലൈഫ്",
    description: "Entrepreneurship development and business support",
    icon: Briefcase,
    color: "bg-division-entrelife",
  },
  {
    id: "embryo",
    name: "Embryo",
    nameMl: "എംബ്രിയോ",
    description: "Child care and early development programs",
    icon: Baby,
    color: "bg-division-embryo",
  },
  {
    id: "aval",
    name: "Aval",
    nameMl: "അവൾ",
    description: "Welfare support wing for women in need",
    icon: HeartHandshake,
    color: "bg-division-aval",
  },
  {
    id: "pennyekart",
    name: "Pennyekart",
    nameMl: "പെന്നിക്കാർട്ട്",
    description: "E-commerce platform for women entrepreneurs",
    icon: ShoppingBag,
    color: "bg-division-pennyekart",
  },
];

export function DivisionsSection() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Divisions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Seven specialized wings dedicated to different aspects of women empowerment
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            ഏഴ് പ്രത്യേക വിഭാഗങ്ങൾ
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {divisions.map((division) => (
            <Link 
              key={division.id}
              to={`/programs?division=${division.id}`}
              className="block"
            >
              <Card 
                className="group h-full hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/50 overflow-hidden cursor-pointer hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${division.color} text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <division.icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                    {division.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">{division.nameMl}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {division.description}
                  </p>
                  <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View Programs</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/divisions">
              Explore All Divisions
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
