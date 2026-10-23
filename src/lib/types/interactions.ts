export type CustomerInteraction = {
    id: string; 
    user_id: string; 
    opportunity_id: string; 
    contact_id: string | null;
    notes: string; 
    interaction_at: string; 
    created_at: string; 
    updated_at: string;
};