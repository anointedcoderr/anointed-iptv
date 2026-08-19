# Anointed Coder brand marks

This folder is the single source of truth for the logo. Every other repo copies
from here rather than re-cutting its own version.

The mark is a roundel: a violet ring around an opaque near-white disc, carrying
the hooded figure in violet, with a cross (Anointed) and curly braces (Coder)
where the face would be.

## Production URLs

All files are served from `https://www.anointedcoder.com/brand/<filename>`.

## Which file to use

| Surface | File |
| --- | --- |
| General use, any background | `logo-512.png` |
| Email (static PNG, absolute https URL) | `logo-192.png` |
| UI chrome, 24 to 40px (navbar pill, chat launcher, popup avatar) | `logo-128.png` |
| Apple touch icon | `apple-icon-180.png` |
| Browser tab / favicon | `favicon-32.png` |
| Re-cutting a new size | `logo-master.png` (903x903) |

`logo-128.png` is the same drawing as `logo-*`, just a smaller export. It is
not the favicon crop: ring, hood, cross and braces are all still present, just
small. Use it for `siteConfig.brand.markSmall`; never point that token at a
`favicon-*` file, which is a different, simplified drawing (see below).

## The disc is part of the design

The near-white disc inside the violet ring is deliberate. It is not a
background plate left over from export, and it must never be flood filled away.
Only the four corners outside the circle are transparent (21.25% of the canvas,
which is what a circle inscribed in a square leaves), so the badge keeps its
round silhouette on whatever it sits on.

That is why there is no separate dark-surface drawing any more. A roundel with
an opaque disc is designed to read on dark chrome: it shows as a white badge,
which is the intended look.

## The `logo-reversed-*` and `favicon-reversed-*` files

These are the same drawing as their unprefixed counterparts, byte for byte.
The old reversed cut dropped the face to transparent and redrew the ink in
light, which is exactly the treatment the roundel forbids. The names are kept
alive so existing callers (`siteConfig.brand.markReversed`, the invoice page,
the footer, and any `EMAIL_LOGO_URL` already pointing at them) keep resolving.
They are redundant and can be retired once every caller has moved across.

## The small-size cut

`favicon-*` is not the same drawing as `logo-*`. The braces are about 10px wide
on a 903px mark, roughly 1.1% of it, so at 16px they land at 0.18 of a device
pixel and cannot render at all. That is a geometric limit, not a sampling one:
a higher-resolution source does not change it.

So the small cut crops into the roundel, drops the braces and the shoulders,
thickens the cross inside its original footprint, and re-rounds the result into
a badge. Each size gets its own amount of thickening, heaviest at 16px, so the
cross stays solid without its arms growing into the hood.

The braces only render as `{}` from roughly 160px up. Between about 48px and
160px they read as a pair of vertical marks rather than braces. The violet ring
has the same problem: at about 1.1% of the width it goes sub-pixel below
roughly 96px, which is another reason the small cut drops it and uses the disc
edge as the silhouette instead.

This crop exists only to survive an actual browser tab (16 to 48px, no
control over rendering). It is not a general small-size logo: anywhere the
page itself controls the display size, even down to 24px, use `logo-128.png`
(the full mark, scaled) instead. Assigning a `favicon-*` file to a UI token
like `siteConfig.brand.markSmall` is the bug this file exists to prevent
recurring.

## Source and regeneration

Cut from a 903x903 RGBA original that already carried correct alpha: no plate
to remove, no cropping or padding needed, the circle is inscribed exactly in
the square with zero margin.

Note that this original is smaller than the 1373x1373 master it replaced. It is
a newer and different drawing (the roundel), not a higher-resolution version of
the old one, so `logo-master.png` is now 903x903 and nothing should be cut
above that size.

Sizes are generated from `logo-master.png`, never from a smaller file.
`apple-icon-180.png` is flattened onto `#fdfdfd` because iOS composites
transparency onto black.
