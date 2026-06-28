// schemaTypes/caseStudy.ts
// ─────────────────────────────────────────────────────────────────────────────
// Case Study document type for The Sonic Media Sanity Studio (v3, TypeScript)
//
// Field mapping to the live website:
//   CARD (listing grid)  → title, slug, category, publishedDate, shortExcerpt,
//                          heroImage
//   DETAIL OVERLAY       → title, subtitle, category, publishedDate,
//                          heroImage (images[0]), secondImage (images[1]),
//                          body (raw HTML rich text)
//   FILTER BUTTONS       → category (value must match HTML data-cat values:
//                          strategy | performance | seo | social | branding | technology)
// ─────────────────────────────────────────────────────────────────────────────

import { defineField, defineType } from 'sanity'

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case Studies',
  type: 'document',

  fields: [

    // ── CORE IDENTITY ─────────────────────────────────────────────────────────

    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description:
        'Full headline shown on the listing card and in the article header. ' +
        'The detail overlay splits this into two lines at word 5 automatically.',
      validation: (Rule) => Rule.required().min(10).max(200),
    }),

    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      description:
        'One-line sub-headline shown below the title inside the article. ' +
        'Also used as alt text for the second image.',
      validation: (Rule) => Rule.required().max(200),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'URL identifier used for deep-linking. ' +
        'Auto-generated from the title — click "Generate". ' +
        'Example: "d2c-growth-playbook" → /case-studies/d2c-growth-playbook',
      options: {
        source: 'title',
        maxLength: 96,
        slugify: (input: string) =>
          input
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .slice(0, 96),
      },
      validation: (Rule) => Rule.required(),
    }),

    // ── CATEGORY — drives filter buttons on the website ───────────────────────

    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description:
        'Primary service category. ' +
        'The value here must match one of the filter button values in casestudies.html ' +
        '(strategy | performance | seo | social | branding | technology | ai | photo | ecommerce | influencer). ' +
        'The label is what the website displays on the card badge and in the detail header.',
      options: {
        list: [
          { title: '💡 Strategy',              value: 'strategy' },
          { title: '🚀 Performance',           value: 'performance' },
          { title: '🔍 SEO',                   value: 'seo' },
          { title: '📣 Social Media',          value: 'social' },
          { title: '🎨 Branding',              value: 'branding' },
          { title: '⚙️ Technology',            value: 'technology' },
          { title: '🤖 AI',                    value: 'ai' },
          { title: '🎬 Photo / Videography',   value: 'photo' },
          { title: '🛒 E-commerce',            value: 'ecommerce' },
          { title: '🤝 Influencer',            value: 'influencer' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),

    // ── PUBLISHED DATE ────────────────────────────────────────────────────────

    defineField({
      name: 'publishedDate',
      title: 'Published Date',
      type: 'datetime',
      description:
        'Displayed on cards and in the detail header (e.g. "May 18, 2026"). ' +
        'Also controls ordering in the Studio list.',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),

    // ── MEDIA: HERO IMAGE (images[0] on the website) ──────────────────────────

    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      description:
        'Main card image AND the first image shown in the article detail. ' +
        '16:9 ratio recommended, min 1200 × 675 px. ' +
        'Used as og:image and Twitter card image.',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
          description:
            'Displayed as a small italic caption below the hero image in the article. ' +
            'Should describe what is shown in the image (e.g. chart, dashboard, result).',
          validation: (Rule) => Rule.required(),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),

    // ── MEDIA: SECOND IMAGE (images[1] on the website) ────────────────────────

    defineField({
      name: 'secondImage',
      title: 'Second Image',
      type: 'image',
      description:
        'Second image shown in the article detail, below the hero image. ' +
        'Same dimensions as Hero Image. ' +
        'Alt text is automatically taken from the Subtitle field.',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'caption',
          title: 'Caption',
          type: 'string',
          description: 'Caption displayed below the second image.',
          validation: (Rule) => Rule.required(),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),

    // ── CARD EXCERPT ──────────────────────────────────────────────────────────

    defineField({
      name: 'shortExcerpt',
      title: 'Short Excerpt',
      type: 'text',
      rows: 3,
      description:
        'Shown on listing cards beneath the title. ' +
        'Keep under 180 characters so it fits cleanly in the card without truncation.',
      validation: (Rule) => Rule.required().max(220),
    }),

    // ── ARTICLE BODY ──────────────────────────────────────────────────────────

    defineField({
      name: 'body',
      title: 'Article Body',
      type: 'array',
      description:
        'Full article content rendered inside the detail overlay. ' +
        'Use H2 for main section headings and H3 for sub-headings. ' +
        'Bold text (Strong) is styled in brand orange (#FF5C00) on the live site. ' +
        'TIP: lead with a why/context section, then numbered or bolded steps, ' +
        'then a closing CTA paragraph.',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'H1',     value: 'h1' },
            { title: 'H2',        value: 'h2' },
            { title: 'H3',        value: 'h3' },
          ],
          marks: {
            decorators: [
              { title: 'Strong (renders orange on site)', value: 'strong' },
              { title: 'Emphasis',                        value: 'em' },
            ],
          },
        },
      ],
      validation: (Rule) => Rule.required(),
    }),

  ],

  // ── STUDIO LIST ORDERING ──────────────────────────────────────────────────

  orderings: [
    {
      title: 'Published Date (Newest First)',
      name: 'publishedDateDesc',
      by: [{ field: 'publishedDate', direction: 'desc' }],
    },
    {
      title: 'Published Date (Oldest First)',
      name: 'publishedDateAsc',
      by: [{ field: 'publishedDate', direction: 'asc' }],
    },
    {
      title: 'Title A–Z',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
    {
      title: 'Category',
      name: 'categoryAsc',
      by: [{ field: 'category', direction: 'asc' }],
    },
  ],

  // ── CARD PREVIEW IN STUDIO ────────────────────────────────────────────────

  preview: {
    select: {
      title:    'title',
      subtitle: 'category',
      media:    'heroImage',
      date:     'publishedDate',
    },
    prepare({ title, subtitle, media, date }: {
      title?:    string
      subtitle?: string
      media?:    unknown
      date?:     string
    }) {
      const CAT_ICON: Record<string, string> = {
        strategy:    '💡',
        performance: '🚀',
        seo:         '🔍',
        social:      '📣',
        branding:    '🎨',
        technology:  '⚙️',
        ai:          '🤖',
        photo:       '🎬',
        ecommerce:   '🛒',
        influencer:  '🤝',
      };
      const CAT_LABEL: Record<string, string> = {
        strategy:    'Strategy',
        performance: 'Performance',
        seo:         'SEO',
        social:      'Social Media',
        branding:    'Branding',
        technology:  'Technology',
        ai:          'AI',
        photo:       'Photo / Videography',
        ecommerce:   'E-commerce',
        influencer:  'Influencer',
      };
      const icon  = subtitle ? (CAT_ICON[subtitle]  ?? '📊') : '📊';
      const label = subtitle ? (CAT_LABEL[subtitle] ?? subtitle) : 'Uncategorised';
      const dateStr = date
        ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'No date';
      return {
        title:    `${icon} ${title ?? 'Untitled'}`,
        subtitle: `${label} · ${dateStr}`,
        media,
      };
    },
  },
});
