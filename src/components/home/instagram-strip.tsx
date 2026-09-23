import Image from "next/image";
import { InstagramIcon } from "@/components/common/social-icons";
import { site } from "@/lib/data/site";

const SHOTS = [
  "/image/hope/four-hope-men-grey.jpeg",
  "/image/faith/four-faith-men-brown.jpeg",
  "/image/god-within-her/four-god-within-her-women-purple-office.jpeg",
  "/image/believes/four-believes-women-black-desk.jpeg",
  "/image/believes/four-believes-women-brown.jpeg",
  "/image/god-within-her/four-god-within-her-women-brown-campaign.jpeg",
  "/image/believes/four-believes-women-olive-campaign.jpeg",
  "/image/god-within-her/four-campaign-poster-god-within-her.jpeg",
  "/image/god-within-her/four-campaign-poster-god-within-her-alt.jpeg",
];

export function InstagramStrip() {
  return (
    <section className="container-page py-16">
      <div className="mb-6 flex flex-col items-center gap-1 text-center">
        <a
          href={site.social.instagram}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 font-display text-xl"
        >
          <InstagramIcon className="size-5 text-gold-dark" />
          {site.social.instagramHandle}
        </a>
        <p className="text-sm text-muted-foreground">
          Tag us to be featured — faith you can wear.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {SHOTS.map((src, i) => (
          <a
            key={i}
            href={site.social.instagram}
            className="group relative aspect-square overflow-hidden rounded-md bg-cream"
          >
            <Image
              src={src}
              alt="Flossy Wears on Instagram"
              fill
              sizes="(min-width: 640px) 15vw, 30vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
