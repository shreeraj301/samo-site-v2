// Samo's legal pages, copied word for word from heysamo.com (privacy, terms, data deletion,
// all last updated 7 October 2026). Do not edit the wording here: change it on the source
// document first, then copy it again.

export type LegalDoc = { slug: string; title: string; updated: string; description: string; html: string };

const privacy = `
<h2>Who we are</h2>
<p>Samo is a product of Acuai Labs Pvt Ltd, 1-A Champa Vihar, M G Road, Kandivli West, Mumbai 400067, India. In this policy, "Samo", "we" and "us" mean Acuai Labs Pvt Ltd.</p>
<p>Samo helps online brands improve their product ads on platforms such as Meta. We read a brand's product data and ad results, make better product images, and publish an updated product feed for the brand.</p>
<p>This policy explains what data we collect, why we collect it, and what you can do about it. Our customers are businesses. This policy covers the people who use Samo for those businesses.</p>
<h2>Data we collect</h2>
<h3>When you create an account</h3>
<ul><li>Your name, work email and phone number</li><li>Your company name and role</li></ul>
<h3>When you connect an ad platform, such as Meta</h3>
<p>You choose which business assets Samo can use. With your permission, we collect:</p>
<ul><li>Your user ID, name and email on that platform</li><li>The ID and name of your business account</li><li>The ad accounts, product catalogs and Pages you choose to share</li><li>Product data in your catalogs (titles, prices, images, stock status)</li><li>Ad performance data for your catalog ads (spend, impressions, clicks, purchases, revenue, by product)</li><li>An access token that lets Samo act on the assets you chose</li></ul>
<h3>When you connect Shopify</h3>
<ul><li>Product data: titles, descriptions, prices, variants, sizes, images, tags and stock levels</li><li>Order data, to count how many units of each product sold. We do not store shopper names, emails, phone numbers or addresses.</li></ul>
<h3>When you use the website or app</h3>
<ul><li>Basic usage data such as pages visited, browser type and IP address</li></ul>
<h3>When you pay us</h3>
<ul><li>Billing name, company name, GST number and billing address</li><li>Card or bank details go straight to our payment provider, Razorpay. We do not see or store them.</li></ul>
<h3>When you contact us</h3>
<ul><li>Messages, feedback and support requests you send us</li></ul>
<h3>When something goes wrong</h3>
<ul><li>Error and log data that helps us fix problems. This may include your user ID.</li></ul>
<p>We do not collect personal data about your shoppers. The product and catalog data we handle is product data, not personal data.</p>
<h2>How we use the data</h2>
<p>We use the data only to provide Samo to you:</p>
<ul><li>To check your product feed for errors and missing data</li><li>To make designed product images and videos for your catalog ads</li><li>To publish an updated product feed to your catalogs on ad platforms</li><li>To remove out-of-stock products from your ads</li><li>To show which products spend money but do not sell</li><li>To send you reports and alerts by Slack, if you turn these on</li><li>To answer your questions through Samo's assistant and connected AI tools</li><li>To keep Samo secure and fix problems</li></ul>
<p>We do not sell your data. We do not use your data to target ads for anyone else. We do not use data from one customer to serve another customer.</p>
<h2>Data from ad platforms</h2>
<p>We use data from ad platforms only for the purposes above and only for the business that shared it. We follow each platform's terms, such as the Meta Platform Terms and Developer Policies. We do not use this data to build user profiles, and we do not share it with data brokers or ad networks.</p>
<p>You can remove Samo's access at any time in the platform's settings. For example, in Meta Business Suite, go to Settings → Integrations → Connected apps, and remove Samo. We stop using the token at once.</p>
<h2>Who we share data with</h2>
<p>We share data only with service providers that help us run Samo. They may use the data only to provide their service to us.</p>
<div class="legal__table"><table><thead><tr><th>Provider</th><th>What they do</th><th>Where</th></tr></thead><tbody><tr><td>Amazon Web Services (AWS)</td><td>Hosting, database and storage. Runs Samo</td><td>India</td></tr><tr><td>OpenRouter</td><td>Sends requests to AI models that write reports and answer questions</td><td>United States</td></tr><tr><td>Razorpay</td><td>Takes payments</td><td>India</td></tr><tr><td>PostHog</td><td>Product and website analytics</td><td>United States</td></tr><tr><td>Google</td><td>Website analytics and tag management</td><td>Global</td></tr><tr><td>HubSpot</td><td>Customer records, website chat and marketing emails</td><td>United States</td></tr><tr><td>Slack</td><td>Sends Slack alerts, if you turn them on</td><td>United States</td></tr><tr><td>Meta</td><td>Our website pixel, and the catalog connection you set up</td><td>Global</td></tr></tbody></table></div>
<p>OpenRouter passes AI requests to model makers such as Anthropic and OpenAI. We set OpenRouter to use only model makers that do not train on our customers' data. We do not let AI model providers train their models on your data.</p>
<p>We may share data if the law requires it, or to protect the rights and safety of Samo, our customers or others.</p>
<p>We may share data with our lawyers, auditors and other professional advisers when they need it to do their work for us.</p>
<p>If Acuai Labs Pvt Ltd merges with, is bought by, or sells part of its business to another company, your data may move to that company. This policy will still apply to it.</p>
<h2>Cookies</h2>
<p>Our website and app use cookies. Cookies are small files that a website stores in your browser.</p>
<ul><li>Needed cookies keep you logged in and keep the app working. You cannot turn these off.</li><li>Analytics cookies show us which pages people visit, so we can improve the site. We use PostHog and Google Analytics.</li><li>Advertising cookies on heysamo.com, such as the Meta Pixel, help us show Samo ads to people who visited our site.</li></ul>
<p>We set only needed cookies until you choose. Analytics and advertising cookies are set only if you agree in our cookie banner. You can change your choice at any time with the "Cookie preferences" link in the footer of every page.</p>
<p>These cookies are only on our own website and app. They are separate from the ad platform data you connect to Samo, which we never use for our own advertising.</p>
<h2>Where data is stored</h2>
<p>We store your data in India, on Amazon Web Services. Some providers in the table above, such as PostHog, Google, HubSpot, Slack and Meta, may process data in other countries. When they do, we use contracts to protect it.</p>
<h2>How long we keep data</h2>
<div class="legal__table"><table><thead><tr><th>Data</th><th>How long we keep it</th></tr></thead><tbody><tr><td>Ad platform and Shopify access tokens</td><td>Deleted at once when you remove Samo's access or close your account</td></tr><tr><td>Product data, feeds, images and videos Samo made</td><td>Deleted within 30 days after your access ends</td></tr><tr><td>Ad performance data</td><td>Kept in summary form while you are a customer. Deleted within 30 days after your access ends</td></tr><tr><td>Account details</td><td>Kept while your account is open. Deleted within 30 days after you ask</td></tr><tr><td>Invoices and billing records</td><td>Kept as long as Indian tax and company law requires</td></tr></tbody></table></div>
<p>You can ask us to delete your data at any time. See the <a href="/data-deletion">Data Deletion</a> page.</p>
<h2>How we protect data</h2>
<ul><li>We encrypt access tokens and connection details.</li><li>We use HTTPS for all data in transit.</li><li>Only staff who need access to do their work can see customer data.</li><li>We keep each customer's data separate from other customers.</li></ul>
<p>No system is fully secure. If a data breach affects you, we will tell you and the authorities as the law requires.</p>
<h2>Your rights</h2>
<p>You can ask us to:</p>
<ul><li>Show you the data we hold about you</li><li>Correct data that is wrong</li><li>Delete your data</li><li>Stop processing your data</li></ul>
<p>To delete data that came from an ad platform or Shopify, see our <a href="/data-deletion">Data Deletion</a> page. For any other request, email <a href="mailto:privacy@heysamo.com">privacy@heysamo.com</a>. We reply within 30 days.</p>
<p>You can stop marketing emails at any time with the unsubscribe link in each email. We still send emails you need to use Samo, such as alerts, reports you turned on, and billing notices.</p>
<h2>Grievance Officer (India)</h2>
<p>Name: Sameer Shah</p>
<p>Email: <a href="mailto:privacy@heysamo.com">privacy@heysamo.com</a></p>
<p>Address: Acuai Labs Pvt Ltd, 1-A Champa Vihar, M G Road, Kandivli West, Mumbai 400067, India</p>
<p>If you are in Australia and you are not happy with our answer, you can contact the Office of the Australian Information Commissioner (OAIC).</p>
<h2>Children</h2>
<p>Samo is a business tool. We do not knowingly collect data from anyone under 18.</p>
<h2>Changes to this policy</h2>
<p>If we change this policy, we update the date at the top. If the change is important, we tell you by email first.</p>
<h2>Contact</h2>
<p>Acuai Labs Pvt Ltd</p>
<p>1-A Champa Vihar, M G Road, Kandivli West, Mumbai 400067, India</p>
<p><a href="mailto:privacy@heysamo.com">privacy@heysamo.com</a></p>
`;

const terms = `
<p>These terms are an agreement between your business and Acuai Labs Pvt Ltd ("Samo", "we", "us"). By using Samo, you agree to them. If you use Samo for a client, you agree on behalf of that client too.</p>
<h2>1. What Samo does</h2>
<p>Samo reads your product data and ad results, makes designed product images and videos, and publishes product feeds to your ad platform catalogs. We may add, change or remove features over time.</p>
<h2>2. Your account</h2>
<p>Keep your login safe. You are responsible for what happens in your account. Only connect stores and ad accounts that you own or have permission to use.</p>
<h2>3. Your data</h2>
<p>Your product data, ad data and brand assets stay yours. You let us use them only to run Samo for you. Our <a href="/privacy">Privacy Policy</a> explains how we handle data.</p>
<h2>4. What Samo makes</h2>
<p>The images, videos and feeds Samo makes for your products are yours to use. Samo's software, templates and designs stay ours.</p>
<h2>5. Fair use</h2>
<p>Do not use Samo to break the law or any ad platform's rules, to make false or misleading ads, or to try to break, copy or overload Samo.</p>
<h2>6. Ad platforms and Shopify</h2>
<p>Samo works through Meta, Shopify and other platforms. We do not control them. If they change their rules or tools, or reject your products or ads, some Samo features may stop working. Check your ads before they run. You are responsible for your ads and ad spend.</p>
<h2>7. Fees</h2>
<p>You pay the fees in your plan or order, plus GST and other taxes. We take payments through Razorpay. Fees are billed in advance and are not refunded for part of a billing period. We tell you at least 30 days before a price change.</p>
<h2>8. Ending the agreement</h2>
<p>You can stop using Samo at any time. Either of us can end the agreement with 30 days' notice by email. We can suspend your account at once if you break these terms. When the agreement ends, we delete your data as our Privacy Policy says.</p>
<h2>9. No guarantee of results</h2>
<p>We work hard to improve your ads, but we do not promise any result in sales, ROAS or ad performance. Samo is provided "as is".</p>
<h2>10. Liability</h2>
<p>Our total liability to you is limited to the fees you paid us in the 3 months before the claim. We are not liable for lost profits, lost sales or indirect losses. These limits do not apply where the law does not allow them.</p>
<h2>11. Changes to these terms</h2>
<p>We may update these terms. We tell you by email at least 15 days before an important change takes effect.</p>
<h2>12. Law</h2>
<p>Indian law applies to these terms. Courts in Mumbai decide any dispute.</p>
<h2>13. Contact</h2>
<p>Acuai Labs Pvt Ltd</p>
<p>1-A Champa Vihar, M G Road, Kandivli West, Mumbai 400067, India</p>
<p><a href="mailto:hello@heysamo.com">hello@heysamo.com</a></p>
`;

const deletion = `
<p>You can remove Samo's access to your ad and store accounts and ask us to delete your data at any time. This page tells you how.</p>
<h2>Step 1: Remove Samo from your ad platform</h2>
<p>Each platform has its own settings for this. For Meta:</p>
<ol><li>Go to business.facebook.com and open your business portfolio.</li><li>Go to Settings → Integrations → Connected apps.</li><li>Find Samo and click Remove.</li></ol>
<p>Samo can no longer read or change anything in that account after this step.</p>
<p>You can also remove Samo from your personal Facebook account: go to Settings and privacy → Settings → Business integrations, find Samo, and click Remove.</p>
<h2>Step 2: Ask us to delete your data</h2>
<p>Email <a href="mailto:privacy@heysamo.com">privacy@heysamo.com</a> from the email address on your Samo account. Use the subject "Delete my data" and tell us your company name.</p>
<p>We delete your account and data on request. You do not need to do anything else in Samo.</p>
<h2>What we delete</h2>
<p>Within 30 days of your request, we delete:</p>
<ul><li>Your account details (name, email, phone)</li><li>Your access tokens and connection details</li><li>Product data we copied from your ad platform catalogs and Shopify store</li><li>Ad performance data from your ad accounts</li><li>Images, videos and feeds that Samo made for you</li><li>Feed files hosted by Samo. Your catalogs stop using them.</li></ul>
<p>We send you an email when the deletion is complete.</p>
<h2>What we keep</h2>
<p>We keep invoices and payment records because the law requires it. We keep these only as long as the law requires.</p>
<h2>Your catalogs after deletion</h2>
<p>Your original products stay as they were. The product feed from Samo stops updating. Remove it from your catalog's data sources so your ads go back to your original product images. In Meta, this is in Commerce Manager under Catalog → Data sources.</p>
<h2>Questions</h2>
<p>Email <a href="mailto:privacy@heysamo.com">privacy@heysamo.com</a> or write to Acuai Labs Pvt Ltd, 1-A Champa Vihar, M G Road, Kandivli West, Mumbai 400067, India.</p>
`;

export const LEGAL: LegalDoc[] = [
  { slug: 'privacy', title: 'Privacy Policy', updated: '7 October 2026', description: 'What data Samo collects, why, who it is shared with, how long it is kept, and your rights.', html: privacy },
  { slug: 'terms', title: 'Terms of Service', updated: '7 October 2026', description: 'The agreement between your business and Acuai Labs Pvt Ltd for using Samo.', html: terms },
  { slug: 'data-deletion', title: 'Data Deletion', updated: '7 October 2026', description: 'How to remove Samo from your ad platform and ask us to delete your data.', html: deletion },
];

export const legalBySlug = (slug: string) => LEGAL.find((d) => d.slug === slug);

/** Label each table cell with its column heading, so a table can stack into rows on phones. */
function labelCells(html: string) {
  return html.replace(/<table>([\s\S]*?)<\/table>/g, (table: string) => {
    const heads = [...table.matchAll(/<th>(.*?)<\/th>/g)].map((m) => m[1]);
    return table.replace(/<tr>([\s\S]*?)<\/tr>/g, (row: string) => {
      let i = 0;
      return row.replace(/<td>/g, () => `<td data-label="${heads[i++] ?? ''}">`);
    });
  });
}

/** Give every h2 an id and return the list for the contents. */
export function withContents(html: string) {
  const toc: { id: string; label: string }[] = [];
  const out = labelCells(html).replace(/<h2>(.*?)<\/h2>/g, (_, label: string) => {
    const id = label.toLowerCase().replace(/^\d+\.\s*/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    toc.push({ id, label });
    return `<h2 id="${id}">${label}</h2>`;
  });
  return { html: out, toc };
}
