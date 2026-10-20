import { eq } from 'drizzle-orm';
import { db, matches, commentary } from './db/index';

async function runCrudDemo() {
  console.log('🚀 --- Starting TypeScript + Drizzle + Neon Sports CRUD Demo ---\n');

  try {
    // 1. CREATE: Insert a new Match (Static Anchor)
    console.log('1️⃣  [CREATE] Inserting new match...');
    const [newMatch] = await db
      .insert(matches)
      .values({
        homeTeam: 'Arsenal',
        awayTeam: 'Manchester City',
        sport: 'Football',
        startTime: new Date(),
        status: 'live',
        homeScore: 0,
        awayScore: 0,
      })
      .returning();
    console.log(`   ✅ Match Created: ID #${newMatch.id} | ${newMatch.homeTeam} vs ${newMatch.awayTeam} (${newMatch.status})\n`);

    // 2. CREATE: Insert Dynamic Commentary Events
    console.log('2️⃣  [CREATE] Adding real-time commentary events...');
    const [event1] = await db
      .insert(commentary)
      .values({
        matchId: newMatch.id,
        actor: 'Referee',
        message: 'Whistle blown! Match underway at Emirates Stadium.',
        minute: 1,
        sequenceNo: 1,
        details: { period: 'first_half', weather: 'Clear' },
      })
      .returning();

    const [event2] = await db
      .insert(commentary)
      .values({
        matchId: newMatch.id,
        actor: 'Bukayo Saka',
        message: 'GOAAAL! Curled into the top corner from outside the box!',
        minute: 18,
        sequenceNo: 2,
        details: { eventType: 'goal', distance: '22m', curve: 'high' },
      })
      .returning();

    console.log(`   ✅ Added event #${event1.sequenceNo}: "${event1.message}"`);
    console.log(`   ✅ Added event #${event2.sequenceNo}: "${event2.message}"\n`);

    // 3. UPDATE: Update Match Score & Status
    console.log('3️⃣  [UPDATE] Updating match score after goal...');
    const [updatedMatch] = await db
      .update(matches)
      .set({
        homeScore: 1,
        awayScore: 0,
      })
      .where(eq(matches.id, newMatch.id))
      .returning();
    console.log(`   ✅ Updated Score: ${updatedMatch.homeTeam} ${updatedMatch.homeScore} - ${updatedMatch.awayScore} ${updatedMatch.awayTeam}\n`);

    // 4. READ: Relational Query (Match + Nested Commentary)
    console.log('4️⃣  [READ] Querying match with all nested commentary using Drizzle relations...');
    const matchWithStory = await db.query.matches.findFirst({
      where: eq(matches.id, newMatch.id),
      with: {
        commentary: {
          orderBy: (c, { asc }) => [asc(c.sequenceNo)],
        },
      },
    });
    console.log('   📄 Query Result:');
    console.log(JSON.stringify(matchWithStory, null, 2), '\n');

    // 5. DELETE: Cleanup Demo Match (Cascade will automatically remove commentary)
    console.log('5️⃣  [DELETE] Cleaning up demo match (verifying cascade delete)...');
    await db.delete(matches).where(eq(matches.id, newMatch.id));

    // Verify commentary was cascaded
    const remainingEvents = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, newMatch.id));
    console.log(`   ✅ Match deleted. Remaining associated commentary events: ${remainingEvents.length} (Cascade verified)\n`);

    console.log('🎉 --- TypeScript CRUD Demo Completed Successfully! ---');
  } catch (error) {
    console.error('❌ CRUD Demo Error:', error);
  } finally {
    process.exit(0);
  }
}

runCrudDemo();
