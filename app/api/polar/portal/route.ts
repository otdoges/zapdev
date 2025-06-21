import { CustomerPortal } from "@polar-sh/nextjs";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// Check if Polar is properly configured
const accessToken = process.env.POLAR_ACCESS_TOKEN;
const server = (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox";

export const GET = !accessToken 
  ? async (request: NextRequest) => {
      console.error("POLAR_ACCESS_TOKEN is not configured");
      return NextResponse.json(
        { error: "Customer portal not available. Please contact support." },
        { status: 500 }
      );
    }
  : CustomerPortal({
      accessToken,
      getCustomerId: async (req: NextRequest) => {
        // Get the current session to identify the customer
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user?.email) {
          throw new Error("User not authenticated");
        }
        
        // Return the customer ID - you might need to adjust this based on how you store customer IDs
        // For now, we'll use the email as the customer external ID
        // You may want to store the actual Polar customer ID in your database
        return user.email;
      },
      server,
    }); 