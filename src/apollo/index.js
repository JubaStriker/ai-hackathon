const { default: axios } = require("axios");

async function fetchLeads(bot, chatId, titles) {
    try {
        const response = await axios.post(
            'https://api.apollo.io/api/v1/mixed_people/search',
            { person_titles: titles, per_page: 10 },
            { headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.APOLLO_API_KEY } }
        );

        const leads = response.data.people || [];
        if (leads.length === 0) return bot.sendMessage(chatId, 'No leads found.');

        let details = [];

        leads.forEach((lead, i) => {

            details.push({
                "first_name": lead.first_name || '',
                "last_name": lead.last_name || '',
                "name": lead.name || '',
                "organization_name": lead?.organization?.name || '',

                "id": lead?.id || '',
            });
        });

        const bulkMatchRes = await axios.post(
            'https://api.apollo.io/api/v1/people/bulk_match?reveal_personal_emails=true&reveal_phone_number=false',
            { details },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                    'Cache-Control': 'no-cache',
                    'x-api-key': process.env.APOLLO_API_KEY
                }
            }
        );

        // console.log('Bulk match result:', bulkMatchRes.data);

        const detailedResponse = bulkMatchRes.data.matches || [];

        let message = `🔥 *Top ${detailedResponse.length} Leads* 🔥\n\n`;

        detailedResponse.forEach((person, i) => {
            message += `*${i + 1}. ${person.name || "N/A"}*\n`;
            message += `🏢 Company: ${person.organization?.name || "N/A"}\n`;
            message += `📧 Email: ${person.email || "N/A"}\n`;
            message += `🔗 [LinkedIn](${person.linkedin_url || "#"})\n`;
            message += `-----------------\n`;
        });

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error('Apollo API Error:', err.response?.data ?? err.message);
        bot.sendMessage(chatId, 'Error fetching leads. Check logs for details.');
    }
}

module.exports = { fetchLeads };