import fs from "fs";
import path from "path";
import matter from "gray-matter";

const DOCS_DIRECTORY = path.join(process.cwd(), "documentation");

export interface DocPost {
    slug: string[];
    frontmatter: {
        title?: string;
        description?: string;
        [key: string]: any;
    };
    content: string;
}

export function getDocBySlug(slug: string[]): DocPost | null {
    try {
        const remainingPath = slug.join("/");
        const realPath = path.join(DOCS_DIRECTORY, `${remainingPath}.md`);
        
        // Check if file exists, if not try index.md in directory
        let fileContents = "";
        
        if (fs.existsSync(realPath)) {
            fileContents = fs.readFileSync(realPath, "utf8");
        } else {
             const indexPath = path.join(DOCS_DIRECTORY, remainingPath, "index.md");
             if (fs.existsSync(indexPath)) {
                 fileContents = fs.readFileSync(indexPath, "utf8");
             } else {
                 return null;
             }
        }

        const { data, content } = matter(fileContents);

        return {
            slug,
            frontmatter: data,
            content,
        };
    } catch (e) {
        return null;
    }
}

export function getAllDocs() {
     // A recursive function could go here to list all docs for the sidebar
     // For now we will rely on manual or simple listing if needed
     return [];
}
