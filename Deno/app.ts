// Routes for research agenda
router.post("/document-research-agenda", async (ctx) => {
  try {
    const body = await ctx.request.body.json();
    
    if (!body.document_id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Document ID is required" };
      return;
    }
    
    if (!body.agenda_items || !Array.isArray(body.agenda_items) || body.agenda_items.length === 0) {
      ctx.response.status = 400;
      ctx.response.body = { error: "At least one agenda item is required" };
      return;
    }
    
    const result = await ResearchAgendaModel.addItems(parseInt(body.document_id), body.agenda_items);
    
    if (result) {
      ctx.response.status = 200;
      ctx.response.body = { message: "Research agenda items added successfully" };
    } else {
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to add research agenda items" };
    }
  } catch (error) {
    console.error("Error adding research agenda items:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: error instanceof Error ? error.message : "Unknown error" };
  }
}); 