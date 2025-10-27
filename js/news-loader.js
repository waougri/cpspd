export async function loadNews() {
    try {
        // Fetch all markdown files from content/news directory
        const response = await fetch(
            "https://api.github.com/repos/waougri/cpspd/contents/content/news"
        );
        const files = await response.json();

        if (!Array.isArray(files)) {
            throw new Error("Invalid response from GitHub API");
        }

        // Filter for markdown files and fetch their content
        const newsPromises = files
            .filter((file) => file.name.endsWith(".md"))
            .map(async (file) => {
                const contentResponse = await fetch(file.download_url);
                const content = await contentResponse.text();
                return parseMarkdownPost(content, file.name);
            });

        const newsItems = await Promise.all(newsPromises);

        // Sort by date (newest first)
        return newsItems
            .filter((item) => item !== null)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error("Error loading news:", error);
        // Return fallback news data
        return getFallbackNews();
    }
}

function parseMarkdownPost(content, filename) {
    try {
        // Extract frontmatter
        const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
        const match = content.match(frontmatterRegex);

        if (!match) {
            console.warn(`No frontmatter found in ${filename}`);
            return null;
        }

        const frontmatter = match[1];
        const lines = frontmatter.split("\n");
        const data = {};

        lines.forEach((line) => {
            const colonIndex = line.indexOf(":");
            if (colonIndex > -1) {
                const key = line.substring(0, colonIndex).trim();
                const value = line
                    .substring(colonIndex + 1)
                    .trim()
                    .replace(/^["']|["']$/g, "");
                data[key] = value;
            }
        });

        // Format date
        const date = new Date(data.date);
        const formattedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        return {
            id: filename.replace(".md", ""),
            slug: filename.replace(".md", ""),
            title: data.title || "Untitled",
            date: data.date,
            formattedDate: formattedDate,
            summary: data.summary || "",
            image: data.image || null,
            body: content.replace(frontmatterRegex, "").trim(),
        };
    } catch (error) {
        console.error(`Error parsing ${filename}:`, error);
        return null;
    }
}

function getFallbackNews() {
    return [
        {
            id: 1,
            date: "2024-10-01",
            formattedDate: "October 2024",
            title: "New AAMI Standards Released",
            summary:
                "Updated guidelines for sterile processing now available. Contact us to ensure your facility meets the latest compliance requirements.",
            image: null,
        },
        {
            id: 2,
            date: "2024-09-01",
            formattedDate: "September 2024",
            title: "Fall Training Sessions",
            summary:
                "Join our comprehensive training program covering advanced sterile processing techniques and quality assurance protocols.",
            image: null,
        },
        {
            id: 3,
            date: "2024-08-01",
            formattedDate: "August 2024",
            title: "Crown Point Expands Services",
            summary:
                "We're excited to announce expanded consulting services to help facilities optimize their sterile processing operations.",
            image: null,
        },
    ];
}