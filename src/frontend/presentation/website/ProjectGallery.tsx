"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSite } from "@/frontend/presentation/shared/SiteProvider";
import Icon from "@/frontend/presentation/shared/Icon";
export default function ProjectGallery() {
  const { publicProjects: projects } = useSite();
  const [filter, setFilter] = useState("all");
  return (
    <>
      <div className="category-tabs">
        {[
          ["all", "Tất cả không gian"],
          ["villa", "Biệt thự"],
          ["house", "Nhà phố"],
          ["interior", "Nội thất"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={filter === id ? "selected" : ""}
            aria-pressed={filter === id}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="project-grid light-projects">
        {projects
          .filter((item) => filter === "all" || item.category === filter)
          .map((item) => (
            <Link
              className="project-card"
              href={`/projects/${item.id}`}
              key={item.id}
            >
              <div className="project-image">
                <Image
                  src={item.image}
                  alt={`Ảnh minh họa ${item.type.toLowerCase()}`}
                  fill
                  sizes="(max-width: 760px) 100vw, 33vw"
                />
                <span className="card-open">
                  <Icon name="diagonal" />
                </span>
              </div>
              <span className="project-type">
                {item.type} · Cảm hứng thiết kế
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Link>
          ))}
      </div>
    </>
  );
}
