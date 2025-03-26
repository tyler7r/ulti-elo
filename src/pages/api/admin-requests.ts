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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { userId, action, teamId, email, name, teamName } = req.body;

  if (!userId || !action || !teamId || !email || !name) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    // Fetch the admin request details
    const { data: request, error: requestError } = await supabase
      .from("admin_requests")
      .select("user_id")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .single();

    if (requestError || !request) {
      return res.status(404).json({ error: "Admin request not found" });
    }

    const { user_id } = request;

    let emailSubject = "";
    let emailBody = "";

    const baseUrl = `${req.headers["x-forwarded-proto"] || "http"}://${
      req.headers.host
    }`;
    const teamLink = `${baseUrl}/team/${teamId}`;

    if (action === "approve") {
      // Add the user as a team admin
      const { error: roleError } = await supabase
        .from("team_admins")
        .insert([{ user_id, team_id: teamId, is_owner: false }]);

      if (roleError) {
        return res.status(500).json({ error: "Failed to add team admin" });
      }

      emailSubject = "Admin Access Approved";
      emailBody = `<h3>Hi ${name},</h3>
                   <p>Your request for admin access ${
                     teamName ? `of <strong>${teamName}</strong>` : null
                   } has been <strong>approved</strong>.</p>
                   <p>You can now manage the team.</p>
                   <p><a href="${teamLink}">View Team</a></p>`;
    } else {
      emailSubject = "Admin Request Rejected";
      emailBody = `<h3>Hi ${name},</h3>
                   <p>Your request for admin access ${
                     teamName ? `of <strong>${teamName}</strong>` : null
                   } has been <strong>rejected</strong>.</p>`;
    }

    // Send email notification to the user
    const emailContent = {
      Messages: [
        {
          From: {
            Email: "no-reply@ulti-elo.com",
            Name: "Ulti ELO",
          },
          To: [{ Email: email }],
          Subject: emailSubject,
          HTMLPart: emailBody,
        },
      ],
    };

    const response = await mailjetClient
      .post("send", { version: "v3.1" })
      .request(emailContent);

    if (response.response.status !== 200) {
      console.error("Failed to send email:", response.response);
      return res.status(500).json({ error: "Failed to send email" });
    }

    // Remove the request after handling
    await supabase
      .from("admin_requests")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", userId);

    res.status(200).json({ message: "Request handled successfully" });
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
