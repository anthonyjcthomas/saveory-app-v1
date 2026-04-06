export interface HappyHourDeal {
    day: string;
    details: string;
    /** 24-hour format string, e.g. "17:00" */
    start_time: string;
    /** 24-hour format string, e.g. "21:00" */
    end_time: string;
    /** Array of day names this deal is active, e.g. ["Monday", "Tuesday"] */
    deal_list: string[];
}

export interface EstablishmentType {
    id: string;
    name: string;
    image: string;
    description: string;
    rating: string;
    location: string;
    happy_hour_deals: HappyHourDeal[];
    latitude: string;
    longitude: string;
    category: string[];
    dotw: string[];
    cuisine: string;
    /** Distance in miles from user, calculated client-side */
    distance?: number | null;
}
