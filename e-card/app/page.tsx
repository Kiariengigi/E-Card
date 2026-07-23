"use client"
import Image from "next/image";
import Link from "next/link"

export default function Home() {
  return (
    <>
    <h1>E-CARD VIEWER</h1>
    <Link href={"/cardview"}>Go to Card</Link>
     </>
  );
}
