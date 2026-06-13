import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  ShoppingCart, Heart, Search, Package, Recycle, Star, User, Settings,
  Truck, Leaf, Award, Bell, Filter, Plus, Check, X, ChevronRight, Globe,
} from "lucide-react";

const SwatchRow = ({
  token, label, description, className,
}: { token: string; label: string; description: string; className: string }) => (
  <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
    <div className={`h-14 w-14 rounded-lg shadow-sm border border-border/50 ${className}`} />
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-sm">{label}</div>
      <div className="text-xs text-muted-foreground">{description}</div>
    </div>
    <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded hidden sm:inline">
      {token}
    </code>
  </div>
);

const Section = ({
  number, title, subtitle, principle, children,
}: { number: string; title: string; subtitle: string; principle: string; children: React.ReactNode }) => (
  <section className="py-16 border-t border-border first:border-0 first:pt-8">
    <div className="grid lg:grid-cols-12 gap-8 mb-10">
      <div className="lg:col-span-4">
        <div className="text-xs font-mono text-accent tracking-widest mb-3">{number}</div>
        <h2 className="text-3xl font-semibold tracking-tight mb-2">{title}</h2>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>
      <div className="lg:col-span-8">
        <div className="bg-secondary/40 border-l-2 border-accent pl-5 py-3 mb-8">
          <div className="text-[11px] uppercase tracking-widest text-accent font-semibold mb-1">
            Design Rationale
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{principle}</p>
        </div>
        {children}
      </div>
    </div>
  </section>
);

export default function StyleGuide() {
  const icons = [
    { Icon: ShoppingCart, name: "ShoppingCart" },
    { Icon: Heart, name: "Heart" },
    { Icon: Search, name: "Search" },
    { Icon: Package, name: "Package" },
    { Icon: Recycle, name: "Recycle" },
    { Icon: Leaf, name: "Leaf" },
    { Icon: Star, name: "Star" },
    { Icon: Award, name: "Award" },
    { Icon: Truck, name: "Truck" },
    { Icon: User, name: "User" },
    { Icon: Settings, name: "Settings" },
    { Icon: Bell, name: "Bell" },
    { Icon: Filter, name: "Filter" },
    { Icon: Globe, name: "Globe" },
    { Icon: Plus, name: "Plus" },
    { Icon: Check, name: "Check" },
    { Icon: X, name: "X" },
    { Icon: ChevronRight, name: "ChevronRight" },
  ];

  return (
    <Layout>
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-secondary/30 to-background">
        <div className="container max-w-6xl py-20">
          <div className="flex items-center gap-2 text-xs font-mono text-accent tracking-widest mb-6">
            <span className="h-px w-8 bg-accent" />
            PLASTICART · DESIGN SYSTEM
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-6 leading-[1.05]">
            A style guide built for <span className="text-accent">trust</span>,
            <br /> clarity, and bilingual commerce.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Plasticart connects Egyptian buyers with verified plastic packaging sellers.
            Every visual decision in this system serves one of three goals: build trust
            with B2B buyers, communicate sustainability, and stay legible across
            English (LTR) and Arabic (RTL) without compromise.
          </p>
        </div>
      </section>

      <div className="container max-w-6xl">
        {/* COLOR */}
        <Section
          number="01 / COLOR"
          title="A restrained, semantic palette"
          subtitle="Navy authority paired with a single living-green accent."
          principle="B2B packaging buyers evaluate suppliers in seconds — overly playful color
            erodes credibility. We anchor on a deep navy primary (215° 60% 32%) that reads as
            institutional and trustworthy, then introduce a single emerald accent (160° 50% 45%)
            reserved exclusively for sustainability cues: recyclable badges, eco-tiers, and
            reward CTAs. Every color is a semantic HSL token in index.css — never hardcoded —
            so dark mode and future rebrands are a one-file change."
        >
          <Card>
            <CardContent className="p-6 space-y-1">
              <SwatchRow token="--primary" label="Primary · Navy 32" description="Authority, headers, primary CTAs" className="bg-primary" />
              <SwatchRow token="--accent" label="Accent · Emerald 45" description="Sustainability, recyclable, rewards" className="bg-accent" />
              <SwatchRow token="--background" label="Background" description="Near-white canvas, low eye strain" className="bg-background border" />
              <SwatchRow token="--foreground" label="Foreground" description="Body text, 20% lightness for comfort" className="bg-foreground" />
              <SwatchRow token="--secondary" label="Secondary" description="Subtle surfaces, filter panels" className="bg-secondary" />
              <SwatchRow token="--muted" label="Muted" description="Disabled states, supporting copy" className="bg-muted" />
              <SwatchRow token="--destructive" label="Destructive" description="Errors, delete, out of stock" className="bg-destructive" />
              <SwatchRow token="--border" label="Border" description="Hairlines, card outlines" className="bg-border" />
            </CardContent>
          </Card>
        </Section>

        {/* TYPOGRAPHY */}
        <Section
          number="02 / TYPOGRAPHY"
          title="One family, two scripts"
          subtitle="IBM Plex Sans + IBM Plex Sans Arabic."
          principle="Most marketplaces force Arabic users into a fallback font that looks
            visibly cheaper than the Latin one. We chose the IBM Plex family because its Latin
            and Arabic cuts were designed together — identical x-height, weight, and rhythm.
            Switching languages doesn't change the visual weight of a product card. A single
            font family also halves the web font payload, which matters on Egyptian mobile networks."
        >
          <Card>
            <CardContent className="p-8 space-y-8">
              <div>
                <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">DISPLAY · 48/56 · SEMIBOLD</div>
                <div className="text-5xl font-semibold tracking-tight leading-tight">Find Quality Plastic Products</div>
                <div className="text-5xl font-semibold tracking-tight leading-tight mt-2" dir="rtl">اعثر على منتجات بلاستيكية</div>
              </div>
              <div className="border-t border-border pt-6">
                <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">H2 · 30/36 · SEMIBOLD</div>
                <div className="text-3xl font-semibold tracking-tight">Verified sellers, ready to ship</div>
              </div>
              <div className="border-t border-border pt-6">
                <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">H3 · 20/28 · MEDIUM</div>
                <div className="text-xl font-medium">500ml Recyclable PET Bottle</div>
              </div>
              <div className="border-t border-border pt-6">
                <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">BODY · 16/24 · REGULAR</div>
                <p className="text-base leading-relaxed text-foreground/80">
                  Food-grade PET with a tamper-evident neck. MOQ 500 units, ships from Alexandria
                  within 3 business days. All commission deducted from seller — your price is final.
                </p>
              </div>
              <div className="border-t border-border pt-6">
                <div className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2">CAPTION · 12/16 · MEDIUM</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  In stock · 1,240 units · Egypt
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* GRID */}
        <Section
          number="03 / GRID & SPACING"
          title="A 12-column grid on a 4px base"
          subtitle="1400px max container, fluid below."
          principle="Every spacing value is a multiple of 4px — this is what gives the
            interface its quiet rhythm. The 12-column grid collapses predictably: 12 cols on
            desktop, 6 on tablet, single column on mobile where we vertically stack dashboard
            cards and forms. The 1400px container ceiling keeps line lengths readable on
            ultrawides without leaving the product grid feeling sparse."
        >
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-12 gap-2 mb-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-24 rounded bg-primary/10 border border-primary/20 flex items-end justify-center pb-2">
                    <span className="text-[10px] font-mono text-primary/70">{i + 1}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-border">
                {[
                  { name: "xs", px: "4px", w: "w-1" },
                  { name: "sm", px: "8px", w: "w-2" },
                  { name: "md", px: "16px", w: "w-4" },
                  { name: "lg", px: "24px", w: "w-6" },
                  { name: "xl", px: "32px", w: "w-8" },
                  { name: "2xl", px: "48px", w: "w-12" },
                  { name: "3xl", px: "64px", w: "w-16" },
                  { name: "4xl", px: "96px", w: "w-24" },
                ].map((s) => (
                  <div key={s.name} className="space-y-2">
                    <div className={`h-3 bg-accent rounded ${s.w}`} />
                    <div className="text-xs font-mono text-muted-foreground">{s.name} · {s.px}</div>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-border">
                <div className="p-4 rounded border border-border">
                  <div className="text-xs font-mono text-muted-foreground mb-1">CONTAINER</div>
                  <div className="font-semibold">max-w-1400px</div>
                </div>
                <div className="p-4 rounded border border-border">
                  <div className="text-xs font-mono text-muted-foreground mb-1">RADIUS</div>
                  <div className="font-semibold">10px · soft, not playful</div>
                </div>
                <div className="p-4 rounded border border-border">
                  <div className="text-xs font-mono text-muted-foreground mb-1">SHADOW</div>
                  <div className="font-semibold">shadow-sm only</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* ICONS */}
        <Section
          number="04 / ICONOGRAPHY"
          title="Lucide, 24px, 2px stroke"
          subtitle="One library. One weight. No exceptions."
          principle="Mixing icon libraries is the fastest way to make an interface feel
            stitched-together. We use Lucide exclusively at a 2px stroke, sized 16/20/24px.
            Functional icons (cart, search, filter) stay neutral foreground. Sustainability
            icons (Recycle, Leaf) inherit the accent green — the green is the meaning, so we
            never duplicate it with a 'recyclable' word label next to the icon."
        >
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {icons.map(({ Icon, name }) => (
                  <div key={name} className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-accent/40 transition-colors">
                    <Icon className="h-6 w-6" strokeWidth={2} />
                    <span className="text-[10px] font-mono text-muted-foreground truncate w-full text-center">{name}</span>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-3 p-3 rounded border border-border">
                  <Search className="h-4 w-4" /> <span className="text-sm">16px · inline</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded border border-border">
                  <Package className="h-5 w-5" /> <span className="text-sm">20px · buttons</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded border border-border">
                  <Recycle className="h-6 w-6 text-accent" /> <span className="text-sm">24px · default</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* COMPONENTS */}
        <Section
          number="05 / COMPONENTS IN CONTEXT"
          title="The system, assembled"
          subtitle="How the tokens behave together."
          principle="A token library only proves itself when components compose without
            friction. Buttons, badges, and inputs share the same radius, border weight, and
            focus ring — so a form, a product card, and a filter panel feel like one product,
            not three."
        >
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Buttons</CardTitle>
                <CardDescription>Primary navy, accent emerald for eco-actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button>Add to cart</Button>
                  <Button variant="secondary">View details</Button>
                  <Button variant="outline">Compare</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Recycle /> Recycle &amp; earn
                  </Button>
                  <Button variant="ghost"><Heart /> Save</Button>
                  <Button variant="destructive">Remove</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Badges &amp; status</CardTitle>
                <CardDescription>Status, not decoration</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Badge>Verified seller</Badge>
                <Badge variant="secondary">In stock</Badge>
                <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Recycle className="h-3 w-3 mr-1" /> Recyclable
                </Badge>
                <Badge variant="outline">MOQ 500</Badge>
                <Badge variant="destructive">Out of stock</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Form controls</CardTitle>
                <CardDescription>Consistent 10px radius, navy focus ring</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Search 500ml PET bottles..." />
                <div className="flex items-center justify-between p-3 rounded-md border border-border">
                  <span className="text-sm">Recyclable only</span>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Product card pattern</CardTitle>
                <CardDescription>The system's hardest-working component</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="aspect-square bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground/40" strokeWidth={1.5} />
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-accent text-accent-foreground text-[10px]">
                        <Recycle className="h-3 w-3 mr-1" /> Recyclable
                      </Badge>
                      <Heart className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h4 className="font-medium text-sm leading-tight">500ml PET Bottle</h4>
                    <div className="text-xs text-muted-foreground">Nile Plastics · Alexandria</div>
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-lg font-semibold text-primary">2.50 ج.م</span>
                      <span className="text-[10px] text-muted-foreground">MOQ 500</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* PRINCIPLES */}
        <Section
          number="06 / PRINCIPLES"
          title="The rules behind the rules"
          subtitle="What we say no to."
          principle="A design system is defined as much by what it forbids as what it permits."
        >
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { t: "Tokens, never hex", d: "No hardcoded #fff or text-white in components. Dark mode is one variable away." },
              { t: "One accent, one meaning", d: "Emerald only ever signals sustainability or reward. Never decorative." },
              { t: "RTL is not a translation", d: "Every component is tested mirrored. Icons that imply direction get flipped." },
              { t: "Mobile stacks, desktop expands", d: "Dashboards and forms collapse to one column on mobile — no horizontal scroll." },
              { t: "No gratuitous motion", d: "Transitions only on color and opacity. Never on layout or scale." },
              { t: "Plain language wins", d: "Bilingual copy is short, declarative, and avoids idiom in both EN and AR." },
            ].map((p) => (
              <div key={p.t} className="p-5 rounded-lg border border-border bg-card">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-1">{p.t}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.d}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <div className="py-16 text-center border-t border-border">
          <p className="text-xs font-mono text-muted-foreground tracking-widest">
            PLASTICART DESIGN SYSTEM · v1.0
          </p>
        </div>
      </div>
    </Layout>
  );
}
