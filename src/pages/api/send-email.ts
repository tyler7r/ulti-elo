// pages/api/send-email.js
import { supabase } from "@/lib/supabase";
import { NextApiRequest, NextApiResponse } from "next";
import Mailjet from "node-mailjet";

const mailjetClient = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY!,
  process.env.MAILJET_SECRET_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { userId, teamId } = req.body;

    if (!userId || !teamId) {
      return res.status(400).json({ error: "Missing userId or teamId" });
    }

    try {
      // Fetch the team owner email from the database (Supabase)
      const baseUrl = `${req.headers["x-forwarded-proto"] || "http"}://${
        req.headers.host
      }`;
      const { data: teamAdmins, error } = await supabase
        .from("teams")
        .select("id, users!teams_owner_id_fkey(email)")
        .eq("id", teamId)
        .single(); // Assuming the team owner is the first admin

      if (error) {
        console.error("Error fetching team owner:", error);
        return res.status(500).json({ error: "Error fetching team owner" });
      }

      const teamOwnerEmail = teamAdmins.users?.email;

      const teamLink = `${baseUrl}/team/${teamId}`;

      // Get the email of the team owner from the users table
      if (teamOwnerEmail) {
        // Prepare the email content
        const emailContent = {
          Messages: [
            {
              From: {
                Email: "no-reply@ulti-elo.com",
                Name: "Ulti ELO",
              },
              To: [
                {
                  Email: teamOwnerEmail,
                },
              ],
              Subject: "New Admin Request",
              TextPart: `A new account has requested admin access to your team. Please review the request. You can review it here: ${teamLink}`,
              HTMLPart: `<h3>A new account has requested admin access to your team.</h3><p>Please review the request.</p><p><a href="${teamLink}">View Team</a></p>`,
            },
          ],
        };

        // Send the email
        const response = await mailjetClient
          .post("send", { version: "v3.1" })
          .request(emailContent);

        // Handle the response
        if (response.response.status === 200) {
          return res.status(200).json({ message: "Email sent successfully" });
        } else {
          return res.status(500).json({ error: "Failed to send email" });
        }
      } else {
        return res.status(500).json({ error: "There is no team owner." });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ error: "Error processing request" });
    }
  } else {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}
